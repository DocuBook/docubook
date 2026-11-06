/**
 * @docubook/plugin-og-image
 *
 * Gives every page a 1200×630 social preview card, rendered at build time
 * from the page's frontmatter with Takumi. Authors write nothing extra:
 *
 * - `transformFrontmatter` points `frontmatter.image` at the page's card, and
 *   flame's own SEO code turns it into an absolute `og:image`;
 * - `injectHead` adds the card's size, type and alt text, and an `og:image`
 *   on the landing page when `meta.ogImage` does not set one;
 * - `onEnd` renders the cards into `<docs>/assets/og/`, skipping the ones
 *   whose inputs did not change;
 * - `handleRequest` renders a card on demand during `flame dev`.
 *
 * An `image` in frontmatter always wins, and `og: false` opts a page out.
 */

import { readFile, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import type { DocuBookPlugin, DocuConfig, PageContext } from "@docubook/flame";
import { presetRegistry, resolveTheme, type ThemeConfig } from "@docubook/themes-colors";
import {
  docsCard,
  homeCard,
  imageRef,
  planCard,
  readFrontmatter,
  sha256,
  skipReason,
  type Card,
  type PlannedCard,
} from "./cards";
import { buildTree, type Brand, type Palette } from "./layouts";
import { LOG_PREFIX, resolveOptions, type OgImageOptions, type ResolvedOptions } from "./options";
import { publishCards, type PublishJob } from "./publish";
import { createEngine, type Engine, type LoadedFont } from "./renderer";
import {
  CARD_DIR,
  cardUrl,
  docsOutputDir,
  findLogoFile,
  findProjectRoot,
  isInside,
  resolveDeployPath,
  resolveSite,
  type Site,
} from "./site";

export type { FontOption, Layout, OgImageOptions, PagesOption } from "./options";

declare const __PLUGIN_VERSION__: string;

/** Logos above this size are skipped: a card shows them at 140 px. */
export const MAX_LOGO_BYTES = 1024 * 1024;

/** Cards kept in memory by the dev server. */
const DEV_CACHE_SIZE = 50;

export interface Logger {
  info(message: string): void;
  warn(message: string): void;
}

export interface PluginInternals {
  /** @internal Project root instead of the `docu.json` lookup from `cwd` (tests). */
  root?: string;
  /** @internal Log sink (tests). */
  log?: Logger;
  /** @internal Renderer factory (tests). */
  createEngine?: (fonts: LoadedFont[]) => Promise<Engine>;
  /** @internal Plugin version that goes into card names (tests). */
  version?: string;
}

interface Runtime {
  engine: Engine;
  brand: Brand;
  /** Hash of the pixels' inputs that are not in the card name. */
  fingerprint: string;
}

const consoleLogger: Logger = {
  info: (message) => console.log(`${LOG_PREFIX} ${message}`),
  warn: (message) => console.warn(`${LOG_PREFIX} ${message}`),
};

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function sizeTags(card: Card): string[] {
  return [
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:type" content="image/png">`,
    `<meta property="og:image:alt" content="${escapeAttr(card.title)}">`,
  ];
}

/** Light-mode colours of the active theme, as flame resolves it. */
export function resolvePalette(config: DocuConfig): Palette {
  const themeConfig = (process.env.FLAME_THEME || config.themes?.colors) as ThemeConfig | undefined;
  const vars = resolveTheme(themeConfig, presetRegistry).variables.root;
  return {
    background: vars.background ?? "0 0% 100%",
    foreground: vars.foreground ?? "220 30% 15%",
    primary: vars.primary ?? "210 81% 56%",
    muted: vars["muted-foreground"] ?? "220 15% 38%",
    border: vars["border-color"] ?? "210 20% 88%",
  };
}

async function loadLogo(
  config: DocuConfig,
  site: Site,
  options: ResolvedOptions,
  log: Logger
): Promise<Uint8Array | undefined> {
  if (options.logo === false) return undefined;
  const value = options.logo ?? config.navbar?.logo?.src;
  if (!value) return undefined;
  const source = options.logo ? `"logo" option` : `navbar.logo.src`;
  const found = findLogoFile(value, site, resolveDeployPath(config));
  if ("reason" in found) {
    const why = {
      remote: "is a URL, and the build never downloads files",
      outside: "points outside the project",
      missing: "was not found in the project",
      type: "is not an SVG, PNG, JPEG or WebP file",
    }[found.reason];
    log.warn(
      `${source} "${value}" ${why}. Cards are rendered without a logo; set the "logo" option to a local file.`
    );
    return undefined;
  }
  const { size } = await stat(found.file);
  if (size > MAX_LOGO_BYTES) {
    log.warn(
      `${source} "${value}" is ${Math.round(size / 1024)} KB, above the 1 MB limit. Cards are rendered without a logo.`
    );
    return undefined;
  }
  return new Uint8Array(await readFile(found.file));
}

async function loadRuntime(
  config: DocuConfig,
  site: Site,
  options: ResolvedOptions,
  log: Logger,
  makeEngine: (fonts: LoadedFont[]) => Promise<Engine>
): Promise<Runtime> {
  const fonts: LoadedFont[] = [];
  for (const font of options.fonts) {
    const path = resolve(site.root, font.path);
    let data: Uint8Array;
    try {
      data = new Uint8Array(await readFile(path));
    } catch (err) {
      throw new Error(
        `${LOG_PREFIX} font "${font.path}" could not be read: ${(err as Error).message}`,
        {
          cause: err,
        }
      );
    }
    fonts.push({ ...font, data });
  }

  const logo = await loadLogo(config, site, options, log);
  const engine = await makeEngine(fonts);
  const palette = resolvePalette(config);
  return {
    engine,
    brand: {
      siteName: site.siteName,
      domain: site.domain,
      logo,
      palette,
      fontFamily: engine.fontFamily,
    },
    fingerprint: sha256(
      JSON.stringify(palette),
      logo ? sha256(logo) : "no-logo",
      ...fonts.map((font) => sha256(font.data))
    ),
  };
}

function describe(list: string[], limit = 5): string {
  const shown = list.slice(0, limit).join(", ");
  return list.length > limit ? `${shown} (+${list.length - limit} more)` : shown;
}

export default function pluginOgImage(
  options?: OgImageOptions,
  internals: PluginInternals = {}
): DocuBookPlugin {
  const resolved = resolveOptions(options);
  const version =
    internals.version ?? (typeof __PLUGIN_VERSION__ === "string" ? __PLUGIN_VERSION__ : "dev");
  const log = internals.log ?? consoleLogger;

  return {
    name: "og-image",
    setup(build) {
      const config = build.config;
      const root = internals.root ?? findProjectRoot();
      for (const [label, path] of [
        ...(typeof resolved.logo === "string" && !resolved.logo.startsWith("/")
          ? [["logo", resolved.logo]]
          : []),
        ...resolved.fonts.map((font, i) => [`fonts[${i}].path`, font.path]),
      ]) {
        if (!isInside(root, resolve(root, path))) {
          throw new Error(`${LOG_PREFIX} "${label}" must point inside the project, not "${path}".`);
        }
      }

      const site = resolveSite(config, resolved, root);
      const plan = (card: Card): PlannedCard => planCard(card, site, resolved, version);
      const wantsHome = () => site.hasLanding && resolved.pages.home && !config.meta?.ogImage;

      let runtime: Promise<Runtime> | undefined;
      const ready = () =>
        (runtime ??= loadRuntime(
          config,
          site,
          resolved,
          log,
          internals.createEngine ?? createEngine
        ));

      build.onStart(async () => {
        if (!site.baseURL) {
          log.warn(
            `meta.baseURL is not set, so og:image stays a relative URL that social sites ignore.`
          );
        }
        await ready();
      });

      build.transformFrontmatter((frontmatter, ctx) => {
        const kind = ctx.slug === "" ? "index" : "docs";
        if (kind === "index" && !site.hasDocsIndex) return;
        if (skipReason(kind, frontmatter, resolved)) return;
        const planned = plan(docsCard(kind, ctx.slug, frontmatter, site));
        return { ...frontmatter, image: imageRef(planned.file) };
      });

      build.injectHead((ctx: PageContext) => {
        if (ctx.pageType === "docs") {
          const kind = ctx.slug === "" ? "index" : "docs";
          const planned = plan(docsCard(kind, ctx.slug, ctx.frontmatter, site));
          // Tags describe the card only when the page actually shows it.
          return ctx.frontmatter.image === imageRef(planned.file) ? sizeTags(planned.card) : [];
        }
        if (ctx.pageType === "home" && wantsHome()) {
          const planned = plan(homeCard(config));
          return [
            `<meta property="og:image" content="${escapeAttr(cardUrl(site, planned.file))}">`,
            ...sizeTags(planned.card),
          ];
        }
        return [];
      });

      build.onEnd(async (_config, pages, { outDir }) => {
        const started = performance.now();
        const rt = await ready();
        const cards: PlannedCard[] = [];
        let skipped = 0;

        const addDocs = async (kind: "docs" | "index", slug: string) => {
          let frontmatter: Record<string, unknown> | undefined;
          try {
            frontmatter = await readFrontmatter(site.docsDir, slug);
          } catch (err) {
            log.warn(
              `skipped "${slug || "index"}": its frontmatter could not be read (${(err as Error).message}).`
            );
            return;
          }
          if (!frontmatter) return;
          if (skipReason(kind, frontmatter, resolved)) {
            skipped++;
            return;
          }
          cards.push(plan(docsCard(kind, slug, frontmatter, site)));
        };

        if (resolved.pages.docs) {
          for (const page of pages) await addDocs("docs", page.slug);
        }
        if (site.hasDocsIndex && resolved.pages.index) await addDocs("index", "");
        if (wantsHome()) cards.push(plan(homeCard(config)));

        const missing = await rt.engine.missingGlyphs(
          new Set(
            cards
              .flatMap(({ card }) => [...`${card.title}${card.description}${card.section ?? ""}`])
              .concat([...site.siteName])
          )
        );
        if (missing.length > 0) {
          const affected = cards
            .filter(({ card }) =>
              missing.some((char) =>
                `${card.title}${card.description}${card.section ?? ""}`.includes(char)
              )
            )
            .map(({ card }) => (card.kind === "docs" ? card.slug : card.kind));
          log.warn(
            `no loaded font can draw ${describe(
              missing.map((char) => `"${char}"`),
              10
            )}, so cards show boxes in their place. ` +
              `Add a font that covers them with the "fonts" option.` +
              (affected.length > 0 ? ` Pages: ${describe(affected)}.` : "")
          );
        }

        const jobs: PublishJob[] = cards.map((planned) => ({
          ...planned,
          renderHash: sha256(planned.nameHash, rt.fingerprint),
        }));
        const cardDir = join(docsOutputDir(outDir, site.prefix), CARD_DIR);
        let result;
        try {
          result = await publishCards(
            jobs,
            cardDir,
            join(dirname(outDir), "og-image.json"),
            (job) => rt.engine.render(buildTree(resolved.layout, job.card, rt.brand))
          );
        } catch (err) {
          throw new Error(`${LOG_PREFIX} ${(err as Error).message}`, { cause: err });
        }

        for (const { file, bytes } of result.oversized) {
          log.warn(
            `${file} is ${Math.round(bytes / 1024)} KB; some apps (WhatsApp) skip previews above 300 KB.`
          );
        }
        const parts = [
          `${result.rendered.length} rendered`,
          `${result.unchanged.length} unchanged`,
        ];
        if (result.removed.length > 0) parts.push(`${result.removed.length} removed`);
        if (skipped > 0) parts.push(`${skipped} pages use their own image`);
        log.info(
          `${jobs.length} cards: ${parts.join(", ")} (${Math.round(performance.now() - started)}ms)`
        );
      });

      // ─── flame dev ────────────────────────────────────────
      const devCache = new Map<string, Uint8Array>();
      const base = `${site.prefix}/${CARD_DIR}/`;

      build.handleRequest(async (req) => {
        const { pathname } = new URL(req.url);
        if (!pathname.startsWith(base)) return;
        const notFound = () => new Response("Not found", { status: 404 });

        let relative: string;
        try {
          relative = decodeURIComponent(pathname.slice(base.length));
        } catch {
          return notFound();
        }
        const match = /^(.+)\.([0-9a-f]{8})\.png$/.exec(relative);
        if (!match) return notFound();
        const [, stem, hash] = match;
        if (stem.split("/").some((s) => !/^[\w@-][\w.@-]*$/.test(s) || s.includes(".."))) {
          return notFound();
        }

        try {
          // `home` and `index` may also be docs slugs; the hash tells them apart.
          const candidates: PlannedCard[] = [];
          if (stem === "home" && wantsHome()) candidates.push(plan(homeCard(config)));
          if (stem === "index" && site.hasDocsIndex && resolved.pages.index) {
            const frontmatter = await readFrontmatter(site.docsDir, "");
            if (frontmatter) candidates.push(plan(docsCard("index", "", frontmatter, site)));
          }
          if (resolved.pages.docs) {
            const frontmatter = await readFrontmatter(site.docsDir, stem);
            if (frontmatter) candidates.push(plan(docsCard("docs", stem, frontmatter, site)));
          }
          // A stale hash still shows the page's current card.
          const chosen = candidates.find((c) => c.nameHash.startsWith(hash)) ?? candidates[0];
          if (!chosen) return notFound();

          const rt = await ready();
          const key = sha256(chosen.nameHash, rt.fingerprint);
          let png = devCache.get(key);
          if (!png) {
            png = await rt.engine.render(buildTree(resolved.layout, chosen.card, rt.brand));
            devCache.set(key, png);
            if (devCache.size > DEV_CACHE_SIZE) devCache.delete(devCache.keys().next().value!);
          }
          return new Response(png as Uint8Array<ArrayBuffer>, {
            headers: { "Content-Type": "image/png", "Cache-Control": "no-cache" },
          });
        } catch (err) {
          return new Response(`${LOG_PREFIX} ${(err as Error).message}`, { status: 500 });
        }
      });
    },
  };
}
