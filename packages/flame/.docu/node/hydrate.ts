import { createHash } from "node:crypto";
import { basename, join } from "node:path";
import { mkdir, rename, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolveTheme, generateThemeCss, presetRegistry } from "@docubook/themes-colors";
import { ASSETS_DIR, LIB_DIR, STYLES_DIR, loadDocuConfig } from "./paths";
import { atomicWriteFile, computeTailwindCacheKey, readStyleCss } from "./cache-key";
import { resolveRoutes } from "./fs-scanner";
import type { AssetManifest, DocuRoute } from "./types";
import type { ThemeConfig } from "@docubook/themes-colors";

const themeRegistry = presetRegistry;

export function createMdxModuleEntries(mdxSources: Record<string, string>) {
  return Object.keys(mdxSources)
    .sort()
    .map((slug) => ({
      slug,
      id: `docubook-mdx-page-${createHash("sha256").update(slug).digest("hex").slice(0, 16)}`,
    }));
}

/**
 * Read the effective theme config with this priority:
 * 1. FLAME_THEME env var (CLI --theme flag)
 * 2. docu.json theme.colors field
 */
export function getThemeConfig(): ThemeConfig | undefined {
  if (process.env.FLAME_THEME) {
    return process.env.FLAME_THEME;
  }
  const config = loadDocuConfig();
  return config.themes?.colors;
}

/** Append theme CSS to compiled Tailwind output based on theme config. */
export function buildThemeCss(baseCss: string, themeConfig: unknown): string {
  try {
    const resolved = resolveTheme(themeConfig as ThemeConfig | undefined | null, themeRegistry);
    return baseCss + "\n" + generateThemeCss(resolved);
  } catch (err) {
    console.warn(
      `[flame] Failed to resolve theme CSS: ${err instanceof Error ? err.message : String(err)}`
    );
    return baseCss;
  }
}

/** Compute inline theme CSS for FOUC prevention. */
export function computeInlineThemeCss(): string | undefined {
  try {
    const themeColors = getThemeConfig();
    if (themeColors) {
      const resolved = resolveTheme(themeColors, themeRegistry);
      return generateThemeCss(resolved);
    }
  } catch (err) {
    console.warn(
      `[flame] Failed to compute inline theme CSS: ${err instanceof Error ? err.message : String(err)}`
    );
  }
  return undefined;
}

function themeCacheSuffix(): string {
  try {
    const themeColors = getThemeConfig();
    return themeColors ? JSON.stringify(themeColors) : "";
  } catch {
    return "";
  }
}

function tailwindCacheKey(styleFile: string): string {
  return computeTailwindCacheKey(readStyleCss(styleFile), `${styleFile}\0${themeCacheSuffix()}`);
}

/** Run Tailwind CLI, caching each route stylesheet by content hash. */
async function buildTailwindCss(
  name: string,
  styleFile: string
): Promise<{ file: string; content: string }> {
  const key = tailwindCacheKey(styleFile);
  const cachedFile = `${name}-${key}.css`;
  const cachedPath = join(ASSETS_DIR, cachedFile);

  if (existsSync(cachedPath)) {
    return { file: cachedFile, content: await Bun.file(cachedPath).text() };
  }

  const tmpCss = join(ASSETS_DIR, `_tmp-${name}-${key}.css`);
  const proc = Bun.spawn(
    ["bun", "x", "@tailwindcss/cli", "-i", join(STYLES_DIR, styleFile), "-o", tmpCss, "--minify"],
    { stdout: "ignore", stderr: "pipe" }
  );
  await proc.exited;
  if (proc.exitCode !== 0) {
    const err = await new Response(proc.stderr).text();
    throw new Error(`Tailwind CSS build failed:\n${err}`);
  }

  let cssContent = await Bun.file(tmpCss).text();
  await unlink(tmpCss).catch(() => {});

  try {
    const themeColors = getThemeConfig();
    if (themeColors) cssContent = buildThemeCss(cssContent, themeColors);
  } catch (err) {
    console.warn(
      `[flame] Failed to resolve theme config: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (!existsSync(cachedPath)) {
    const { writeFile } = await import("node:fs/promises");
    await atomicWriteFile(writeFile, rename, unlink, cachedPath, cssContent);
  }

  return { file: cachedFile, content: cssContent };
}

export async function buildClientBundle(
  /** slug → compiled MDX ESM module source (program format) for static hydration. */
  mdxSources: Record<string, string> = {}
): Promise<AssetManifest> {
  await mkdir(ASSETS_DIR, { recursive: true });

  const nodeEnv = process.env.NODE_ENV || "development";
  const mdxEntries = createMdxModuleEntries(mdxSources);
  const mdxEntriesById = new Map(mdxEntries.map((entry) => [entry.id, entry]));
  const result = await Bun.build({
    entrypoints: [join(LIB_DIR, "client.ts"), join(LIB_DIR, "home-client.ts")],
    outdir: ASSETS_DIR,
    splitting: true,
    naming: {
      entry: "[name]-[hash].[ext]",
      chunk: "chunks/[name]-[hash].[ext]",
      asset: "assets/[name]-[hash].[ext]",
    },
    target: "browser",
    minify: nodeEnv === "production",
    define: { "process.env.NODE_ENV": JSON.stringify(nodeEnv) },
    plugins: [
      {
        name: "docu-config",
        setup(build) {
          build.onResolve({ filter: /client-routes$/ }, (args) => ({
            path: args.path,
            namespace: "client-routes",
          }));
          build.onLoad({ filter: /.*/, namespace: "client-routes" }, () => {
            const config = loadDocuConfig();
            const resolved = {
              ...config,
              routes: resolveRoutes(config.routes as DocuRoute[] | undefined),
            };
            return {
              contents: [
                `import type { DocuRoute, DocuConfig } from "./types";`,
                `const docuConfig = ${JSON.stringify(resolved)};`,
                `export const routes = docuConfig.routes || [];`,
                `export const config = docuConfig;`,
              ].join("\n"),
              loader: "ts",
            };
          });
        },
      },
      {
        name: "mdx-hydrate",
        setup(build) {
          build.onResolve({ filter: /^docubook-mdx-page-[a-f0-9]{16}$/ }, (args) => ({
            path: args.path,
            namespace: "mdx-module",
          }));
          build.onLoad({ filter: /.*/, namespace: "mdx-module" }, (args) => {
            const entry = mdxEntriesById.get(args.path);
            const contents = entry == null ? undefined : mdxSources[entry.slug];
            if (contents == null) {
              return {
                errors: [{ text: `unknown mdx module: ${args.path}` }],
                contents: "",
                loader: "js",
              };
            }
            return { contents, loader: "js" };
          });
          build.onResolve({ filter: /mdx-manifest$/ }, (args) => ({
            path: args.path,
            namespace: "mdx-manifest",
          }));
          build.onLoad({ filter: /.*/, namespace: "mdx-manifest" }, () => {
            const map = mdxEntries
              .map(({ slug, id }) => `${JSON.stringify(slug)}: () => import(${JSON.stringify(id)})`)
              .join(", ");
            return {
              contents: `export const mdxModules = { ${map} };\n`,
              loader: "js",
            };
          });
        },
      },
    ],
  });

  if (!result.success) {
    for (const log of result.logs) console.error(log);
    throw new Error("Client bundle failed");
  }

  const entryFiles = result.outputs
    .filter((output) => output.kind === "entry-point")
    .map((output) => basename(output.path));
  const docsJs = entryFiles.find((file) => file.startsWith("client-"));
  const homeJs = entryFiles.find((file) => file.startsWith("home-client-"));
  if (!docsJs || !homeJs) {
    throw new Error("Client bundle produced incomplete entry-point outputs");
  }

  const [{ file: docsCss }, { file: siteCss }] = await Promise.all([
    buildTailwindCss("docs", "globals.css"),
    buildTailwindCss("site", "site.css"),
  ]);

  const manifest: AssetManifest = {
    docs: { js: docsJs, css: docsCss },
    home: { js: homeJs, css: siteCss },
    notFound: { css: siteCss },
  };
  await Bun.write(join(ASSETS_DIR, "manifest.json"), JSON.stringify(manifest));
  return manifest;
}
