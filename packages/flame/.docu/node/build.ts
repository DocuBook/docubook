import {
  readFile,
  writeFile,
  mkdir,
  readdir,
  copyFile,
  rename,
  rm,
  unlink,
} from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  compileMdx,
  compileMdxModule,
  frontmatterField,
  getGitLastModifiedBatch,
  getPageContent,
  getPageFrontmatter,
  getPageStripped,
  registerPageContent,
} from "./mdx";
import {
  DOCS_DIR,
  DIST_DIR,
  DOCS_OUT_DIR,
  ASSETS_DIR,
  CACHE_FILE,
  DOCS_ASSETS_DIR,
  PROJECT_ROOT,
  PAGES_DIR,
  loadDocuConfig,
  servedBasePath,
  docsDepth,
  deployPath,
  assertValidBasePath,
  assertValidExperimental,
  resolveOwnPages,
  bundlePath,
  notFoundPath,
  standaloneRoot,
  ownPages,
  redirectHtml,
  cleanRootBundles,
  OWN_PAGES_BUNDLE_DIR,
} from "./paths";
import { htmlShell } from "./html";
import { generateSearchIndex } from "./search-indexer";
import { buildClientBundle, computeInlineThemeCss, cssBundleStamp } from "./hydrate";
import { logger } from "./logger";
import { initSentry, captureException } from "./sentry";
import { loadPlugins } from "./plugin-loader";
import { BuildPluginBuilder } from "./plugin-builder";
import { scanMdxFiles, resolveDocsIndexSource } from "./server-utils";
import { findMissingRouteTargets, missingRoutesWarning } from "./route-check";
import { defaultFavicon } from "./paths";
import type { AssetManifest, BuildCache, BuildCacheMeta, CliArgs } from "./types";
import { isCacheEntry } from "./types";
import {
  BUILD_CACHE_VERSION,
  atomicWriteFile,
  hashMdxSources,
  hookMemoryPressure,
  renderToolchainStamp,
  runtimeStamp,
  configStamp,
  pruneRemovedPages,
  previousPageKeys,
} from "./cache-key";
import { clearDerivedPageCaches } from "./mdx";
import { generateNonce, cspHeader } from "./security";
import type { PageMeta, PageContext } from "./plugin";
import { buildSeoMeta } from "./seo";
import DocsPage from "../pages/docs/[[...slug]]";
import IndexPage from "../pages/index";
import NotFoundPage from "../pages/404";
import { DocsLayout } from "../components/DocsLayout";

const docuConfig = loadDocuConfig();
// `experimental.pages`: the project brings its own landing page, so the build
// owns nothing outside the docs prefix — the 404 and the bundles move inside
// it. See ./experimental.ts.
const bringOwnPages = resolveOwnPages(docuConfig);

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  return {
    force: args.includes("--force") || args.includes("-f"),
    clean: args.includes("--clean") || args.includes("-c"),
  };
}

function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex").slice(0, 16);
}

async function readCache(): Promise<BuildCache> {
  try {
    if (existsSync(CACHE_FILE)) {
      const data = await readFile(CACHE_FILE, "utf-8");
      const parsed = JSON.parse(data) as BuildCache;
      // Toolchain upgrade (Bun 1.3 → 1.4, Tailwind CLI bump) changes build
      // output without changing page content — a stale cache would false-hit.
      // Discard when the version stamp or runtime fingerprint mismatches.
      const meta = parsed.__meta__ as BuildCacheMeta | undefined;
      // `render` covers the framework's own rendering sources: a template or
      // meta-tag edit changes output without touching any MDX file, so an
      // older cache must not be trusted after one.
      if (
        !meta ||
        meta.version !== BUILD_CACHE_VERSION ||
        meta.runtime !== runtimeStamp() ||
        meta.render !== renderToolchainStamp()
      ) {
        return {};
      }
      return parsed;
    }
  } catch (err) {
    console.error("Failed to load build cache:", (err as Error).message);
  }
  return {};
}

/** Stamp the cache with the current toolchain fingerprint. */
function stampCache(cache: BuildCache): void {
  cache.__meta__ = {
    hash: `${BUILD_CACHE_VERSION}:${runtimeStamp()}`,
    mtime: 0,
    builtAt: Date.now(),
    version: BUILD_CACHE_VERSION,
    runtime: runtimeStamp(),
    render: renderToolchainStamp(),
  };
}

async function writeCache(cache: BuildCache): Promise<void> {
  stampCache(cache);
  // Atomic tmp+rename: a crash mid-write never leaves a corrupt cache file.
  await atomicWriteFile(writeFile, rename, unlink, CACHE_FILE, JSON.stringify(cache, null, 2));
}

export function parseConcurrency(): number {
  return Math.max(1, parseInt(process.env.BUILD_CONCURRENCY || "4", 10) || 4);
}

type RebuildDecision = "yes" | "hash_check" | "no";

export function shouldRebuild(path: string, mtime: number, cache: BuildCache): RebuildDecision {
  const cached = cache[path];
  if (!isCacheEntry(cached)) return "yes";
  // Any mtime drift vs the recorded one — a newer edit, or mtime moving
  // backwards (rsync -a, cp -p, snapshot restore) — falls through to the
  // hash check: hashing an unchanged file is cheap, serving a stale page
  // is not. Only an untouched mtime skips without reading the file.
  if (mtime !== cached.mtime) return "hash_check";
  return "no";
}

let assetManifest: AssetManifest = {
  docs: { js: "client.js", css: "docs.css" },
  home: { js: "home-client.js", css: "site.css" },
  notFound: { css: "site.css" },
};

/**
 * Reuse manifest.json on bundle cache hit; fall back to a full rebuild
 * when the manifest is missing or malformed.
 */
async function resolveAssetManifest(
  bundleHit: boolean,
  mdxSources: Record<string, string>
): Promise<AssetManifest> {
  if (!bundleHit) return buildClientBundle(mdxSources);
  try {
    const manifest = JSON.parse(
      await readFile(join(ASSETS_DIR, "manifest.json"), "utf-8")
    ) as Partial<AssetManifest>;
    if (
      typeof manifest.docs?.js === "string" &&
      typeof manifest.docs.css === "string" &&
      (bringOwnPages
        ? manifest.home === undefined
        : typeof manifest.home?.js === "string" && typeof manifest.home.css === "string") &&
      typeof manifest.notFound?.css === "string"
    ) {
      return manifest as AssetManifest;
    }
  } catch {
    // corrupt/missing manifest — rebuild below
  }
  return buildClientBundle(mdxSources);
}

let inlineThemeCss: string | undefined;

async function renderDocsPage(
  slug: string,
  rawMdx: string,
  filePath: string,
  gitDates?: Map<string, string>,
  builder?: BuildPluginBuilder | null,
  nonce?: string
): Promise<string> {
  let content = rawMdx;
  if (builder) {
    const transformed = await builder.runOnLoad(filePath, content);
    if (transformed?.contents) {
      content = transformed.contents;
    }
  }

  let result;
  try {
    const remarkPlugins = builder?.collectRemarkPlugins();
    const rehypePlugins = builder?.collectRehypePlugins();
    // Parse-once: reuse the prePass frontmatter + stripped content so the
    // SSR phase does not re-extract them. Only when the prePass actually
    // registered them — otherwise compileMdx does its own extraction.
    const preFm = getPageFrontmatter(`/${slug}`);
    const preStripped = getPageStripped(`/${slug}`);
    const pre =
      preFm !== undefined && preStripped !== undefined
        ? { frontmatter: preFm, strippedContent: preStripped }
        : undefined;
    result = await compileMdx(
      content,
      filePath,
      gitDates,
      remarkPlugins,
      rehypePlugins,
      undefined,
      pre
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown MDX error";
    throw new Error(`MDX Error in: docs/${slug}.mdx\n${msg}`, { cause: err });
  }

  let frontmatter = result.frontmatter as Record<string, unknown>;
  if (builder) {
    frontmatter = await builder.runTransformFrontmatterChain(frontmatter, {
      slug,
      filePath,
      content,
    });
  }

  const title = frontmatterField(frontmatter, "title") || slug || "Docs";
  const description = frontmatterField(frontmatter, "description");
  const slugParts = slug ? slug.split("/") : [];

  const page = React.createElement(
    DocsLayout,
    { repoUrl: docuConfig.repo?.url },
    React.createElement(DocsPage, {
      slug: slugParts,
      title,
      description,
      date: frontmatterField(frontmatter, "date") || undefined,
      // Render MDX content as its own root: client hydrates the island as a
      // separate root, so SSR must be root-relative too or useId-based ids
      // (mdx-compiler components) mismatch during hydration.
      content: renderToString(result.content),
      tocs: result.tocs,
      filePath,
      repoUrl: docuConfig.repo?.url,
      mdxSlug: slug,
    })
  );

  const body = renderToString(page);

  const ctx: PageContext = {
    pageType: "docs",
    assets: assetManifest.docs,
    slug,
    filePath,
    frontmatter,
    content,
    config: docuConfig,
  };
  const headExtra = builder?.collectHead(ctx);
  const bodyExtra = builder?.collectBody(ctx);

  const depth = docsDepth(slug, servedBasePath());
  const favicon = docuConfig.meta?.favicon || defaultFavicon();
  const seo = buildSeoMeta(docuConfig, frontmatter, slug || "");
  // Parity with build.impl.ts: static hosts without header control (GitHub
  // Pages) rely on the <meta> CSP for the per-page script policy.
  const csp = nonce ? cspHeader(nonce) : undefined;
  let html = htmlShell({
    title,
    description,
    body,
    favicon,
    seo,
    csp,
    css: ctx.assets.css,
    js: ctx.assets.js,
    nonce,
    themeCss: inlineThemeCss,
    depth,
    basePath: servedBasePath(),
    bundlePath: bundlePath(),
    // Under `experimental.pages` an authored `docs/404.mdx` is the 404 page the
    // host serves at whatever path was requested, so its asset URLs must not
    // depend on depth — the same reason the generated 404 is root-absolute.
    ...(slug === "404" && ownPages() ? { absoluteAssets: true, deployPath: deployPath() } : {}),
    headExtra,
    bodyExtra,
  });

  if (builder) {
    html = await builder.runTransformHtmlChain(html, ctx);
  }

  return html;
}

async function copyDirectoryRecursive(src: string, dest: string): Promise<void> {
  if (!existsSync(src)) return;
  await mkdir(dest, { recursive: true });
  const entries = await readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDirectoryRecursive(srcPath, destPath);
    } else {
      await copyFile(srcPath, destPath);
    }
  }
}

async function build() {
  const args = parseArgs();

  // Bun 1.4 `process.on("memoryPressure")`: drop parsed page maps when the
  // OS runs low on memory (long CI builds). No-op on older runtimes.
  hookMemoryPressure(clearDerivedPageCaches);

  // Normalized prefixes (case, whitespace, unservable characters) and values
  // that cannot be honored would otherwise only surface after the whole build —
  // report them, or stop before anything is written.
  for (const warning of assertValidBasePath()) logger.warn(warning.message);
  for (const warning of assertValidExperimental()) logger.warn(warning.message);

  logger.buildStart();

  if (args.clean) {
    try {
      await rm(DIST_DIR, { recursive: true, force: true });
    } catch (err) {
      console.error("Failed to clean dist directory:", (err as Error).message);
    }
  }

  await mkdir(DIST_DIR, { recursive: true });
  await mkdir(ASSETS_DIR, { recursive: true });

  await copyDirectoryRecursive(DOCS_ASSETS_DIR, join(DOCS_OUT_DIR, "assets"));

  const mdxFiles = await scanMdxFiles(DOCS_DIR);
  // A sidebar entry whose page was renamed or deleted links to a 404; say so
  // before building rather than shipping the broken link silently.
  const routesWarning = missingRoutesWarning(
    findMissingRouteTargets(
      docuConfig.routes,
      mdxFiles.map((f) => f.path),
      Boolean(resolveDocsIndexSource(DOCS_DIR)),
      { separator: docuConfig.sidebar?.context === "separator" }
    )
  );
  if (routesWarning) logger.warn(routesWarning);
  const cache = args.force ? {} : await readCache();
  // Read before the cache can be discarded or rewritten: it is the only record
  // of which pages the previous build wrote (see pruneRemovedPages below).
  const previousPages = previousPageKeys(CACHE_FILE);
  let built = 0;
  let skipped = 0;

  const pluginsConfig = docuConfig.plugins ?? [];
  const builder = pluginsConfig.length > 0 ? new BuildPluginBuilder(docuConfig) : null;
  if (builder) {
    const plugins = await loadPlugins(pluginsConfig);
    for (const plugin of plugins) {
      await plugin.setup(builder);
    }
    await builder.runOnStart();
  }

  // Pre-compile every page's MDX to an ESM module (program format) so the
  // client bundle can hydrate the content island statically — no new Function.
  // Mirrors the page loop's transform + plugin chain so SSR and client trees
  // match. Runs for all files regardless of cache; the bundle is shared by
  // every page, so a content change invalidates the page cache anyway.
  const mdxSources: Record<string, string> = {};
  const prePassTasks = mdxFiles.map(async (file) => {
    let raw: string;
    try {
      raw = await readFile(file.absPath, "utf-8");
    } catch {
      return;
    }
    // Cache the original content so the page loop does not re-read the file
    // (one disk read per file — the frontmatter is parsed once here too).
    registerPageContent(`/${file.path}`, raw);
    let content = raw;
    if (builder) {
      const relPath = file.absPath.replace(PROJECT_ROOT + "/", "");
      const transformed = await builder.runOnLoad(relPath, content);
      if (transformed?.contents) content = transformed.contents;
    }
    const remarkPlugins = builder?.collectRemarkPlugins();
    const rehypePlugins = builder?.collectRehypePlugins();
    mdxSources[file.path] = await compileMdxModule(
      content,
      remarkPlugins,
      rehypePlugins,
      `/${file.path}`
    );
  });
  await Promise.all(prePassTasks);

  // The docs root (index.mdx, or index.md) renders with slug "" — mirror that
  // key so the index page hydrates too. Its render has its own try/catch; skip
  // on error.
  const indexSource = resolveDocsIndexSource(DOCS_DIR);
  const docsIndexPath = join(DOCS_OUT_DIR, "index.html");
  // At the deployment root (`basePath: ""`) this path is `dist/index.html`,
  // which belongs to the generated landing page — unless the project brings
  // its own pages: nothing else can own `/` then, so the docs index takes it.
  const docsIndexWritable = DOCS_OUT_DIR !== DIST_DIR || bringOwnPages;
  // If the source was removed since the previous build, don't ship stale docs
  // output.
  if (!indexSource && docsIndexWritable) {
    await rm(docsIndexPath, { force: true });
  }
  if (indexSource) {
    try {
      const indexRaw = await readFile(indexSource, "utf-8");
      let indexContent = indexRaw;
      if (builder) {
        const relPath = indexSource.replace(PROJECT_ROOT + "/", "");
        const transformed = await builder.runOnLoad(relPath, indexContent);
        if (transformed?.contents) indexContent = transformed.contents;
      }
      mdxSources[""] = await compileMdxModule(
        indexContent,
        builder?.collectRemarkPlugins(),
        builder?.collectRehypePlugins()
      );
    } catch {
      // ignore — the index render reports its own error
    }
  }

  logger.bundleStart();
  let t = performance.now();
  // Skip the JS bundle when the compiled MDX sources *and* the stylesheet
  // fingerprint are unchanged: the bundle is shared by every page, so its hash
  // doubles as the content fingerprint.
  const bundleHash = hashMdxSources(mdxSources, cssBundleStamp());
  const lastBundle = cache["__bundle__"];
  const bundleHit =
    isCacheEntry(lastBundle) &&
    lastBundle.hash === bundleHash &&
    existsSync(join(ASSETS_DIR, "manifest.json"));
  assetManifest = await resolveAssetManifest(bundleHit, mdxSources);
  logger.bundleDone(Math.round(performance.now() - t));

  inlineThemeCss = computeInlineThemeCss();

  const lastManifest = cache["__assets__"];
  // The config is part of every rendered page (sidebar, navbar, SEO), so a
  // config-only edit has to re-render pages even when the bundle is reused.
  const assetHash = `${JSON.stringify(assetManifest)}\0${configStamp()}`;
  const assetsChanged = !isCacheEntry(lastManifest) || lastManifest.hash !== assetHash;
  if (assetsChanged) {
    cache["__assets__"] = { hash: assetHash, mtime: 0, builtAt: Date.now() };
  }
  if (!bundleHit) {
    cache["__bundle__"] = { hash: bundleHash, mtime: 0, builtAt: Date.now() };
  }

  logger.spinner.start("Building pages...");
  t = performance.now();

  const allRelPaths = mdxFiles.map((f) => f.absPath.replace(PROJECT_ROOT + "/", ""));

  if (indexSource) {
    allRelPaths.push(indexSource.replace(PROJECT_ROOT + "/", ""));
  }
  const gitDates = await getGitLastModifiedBatch(allRelPaths);

  const CONCURRENCY = parseConcurrency();
  const buildTasks = [];
  const errors: string[] = [];

  for (const file of mdxFiles) {
    const rebuildDecision = shouldRebuild(file.path, file.mtime, cache);

    if (rebuildDecision === "no" && !builder) {
      const outputPath = join(DOCS_OUT_DIR, `${file.path}.html`);
      if (existsSync(outputPath) && !assetsChanged) {
        skipped++;
        continue;
      }
    }

    let rawMdx = getPageContent(`/${file.path}`);
    if (rawMdx === undefined) {
      try {
        rawMdx = await readFile(file.absPath, "utf-8");
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
        continue;
      }
    }

    if (rebuildDecision === "hash_check" && !builder) {
      const contentHash = hashContent(rawMdx);
      const cached = cache[file.path];
      if (isCacheEntry(cached) && cached.hash === contentHash) {
        if (!assetsChanged) {
          const outputPath = join(DOCS_OUT_DIR, `${file.path}.html`);
          if (existsSync(outputPath)) {
            cache[file.path] = { ...cached, mtime: file.mtime, builtAt: Date.now() };
            skipped++;
            continue;
          }
        }
      }
    }

    const relPath = file.absPath.replace(PROJECT_ROOT + "/", "");
    const capturedRawMdx = rawMdx;
    const capturedFile = file;

    buildTasks.push(async () => {
      try {
        const pageNonce = generateNonce();
        const html = await renderDocsPage(
          capturedFile.path,
          capturedRawMdx,
          relPath,
          gitDates,
          builder,
          pageNonce
        );
        const outputPath = join(DOCS_OUT_DIR, `${capturedFile.path}.html`);
        await mkdir(dirname(outputPath), { recursive: true });
        await writeFile(outputPath, html);
        cache[capturedFile.path] = {
          hash: hashContent(capturedRawMdx),
          mtime: capturedFile.mtime,
          builtAt: Date.now(),
        };
        built++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(msg);
        console.error(`\n\u274C ${msg}\n`);
      }
    });
  }

  for (let i = 0; i < buildTasks.length; i += CONCURRENCY) {
    await Promise.all(buildTasks.slice(i, i + CONCURRENCY).map((fn) => fn()));
  }

  // Sources deleted or renamed since the last build: their HTML would keep
  // being published with stale navigation. Runs right after the docs pages and
  // before anything else is written: the docs index and the 404 page can share
  // a path with a docs page (`docs/404.mdx` under experimental.pages, or at a
  // root deployment), and pruning after them would delete the fresh output.
  // Also before plugins' onEnd, so a sitemap or feed never sees the orphans.
  const removedPages = await pruneRemovedPages(
    cache,
    mdxFiles.map((f) => f.path),
    DOCS_OUT_DIR,
    previousPages
  );
  if (removedPages.length > 0) {
    logger.warn(
      `Removed ${removedPages.length} page(s) whose source is gone: ${removedPages.join(", ")}`
    );
  }

  if (indexSource) {
    try {
      const indexRaw = await readFile(indexSource, "utf-8");
      const indexRelPath = indexSource.replace(PROJECT_ROOT + "/", "");
      const indexHtml = await renderDocsPage(
        "",
        indexRaw,
        indexRelPath,
        gitDates,
        builder,
        generateNonce()
      );
      if (docsIndexWritable) {
        await mkdir(DOCS_OUT_DIR, { recursive: true });
        await writeFile(docsIndexPath, indexHtml);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`index: ${msg}`);
      console.error(`\n❌ Failed to build index: ${msg}\n`);
    }
  }

  if (bringOwnPages) {
    // The project owns `/`: never ship a stale landing page from a build made
    // before the flag was set. At the deployment root `index.html` is the docs
    // index, written (or removed) above. A standalone deploy — Flame is the
    // whole site — gets a redirect to the docs instead.
    if (DOCS_OUT_DIR !== DIST_DIR) {
      if (standaloneRoot()) {
        await writeFile(join(DIST_DIR, "index.html"), redirectHtml(servedBasePath()));
      } else {
        await rm(join(DIST_DIR, "index.html"), { force: true });
      }
    }
    // A default build left its bundles at the dist root; they now live under
    // the docs prefix.
    await cleanRootBundles();
  } else {
    // The flag was turned off: drop the bundle tree and the 404 a flagged build
    // left under the docs prefix — unless that 404 is a docs page of its own.
    await rm(join(DOCS_OUT_DIR, OWN_PAGES_BUNDLE_DIR), { recursive: true, force: true });
    if (DOCS_OUT_DIR !== DIST_DIR && !mdxFiles.some((f) => f.path === "404")) {
      await rm(join(DOCS_OUT_DIR, "404.html"), { force: true });
    }
    const homeAssets = assetManifest.home;
    if (!homeAssets) throw new Error("Client bundle has no landing entry");
    const landingPage = React.createElement(IndexPage);
    const landingFavicon = docuConfig.meta?.favicon || defaultFavicon();
    const landingSeo = buildSeoMeta(
      docuConfig,
      docuConfig.meta as unknown as Record<string, unknown>,
      "",
      "landing"
    );
    const landingNonce = generateNonce();
    const landingContext: PageContext = {
      pageType: "home",
      assets: homeAssets,
      slug: "",
      filePath: join(PAGES_DIR, "index.tsx"),
      frontmatter: { ...docuConfig.meta } as unknown as Record<string, unknown>,
      config: docuConfig,
    };
    let landingHtml = htmlShell({
      title: docuConfig.meta?.title || "DocuBook",
      description: docuConfig.meta?.description || "",
      body: renderToString(landingPage),
      favicon: landingFavicon,
      seo: landingSeo,
      csp: cspHeader(landingNonce),
      css: landingContext.assets.css,
      js: landingContext.assets.js,
      nonce: landingNonce,
      themeCss: inlineThemeCss,
      basePath: servedBasePath(),
      bundlePath: bundlePath(),
      headExtra: builder?.collectHead(landingContext),
      bodyExtra: builder?.collectBody(landingContext),
    });
    if (builder) landingHtml = await builder.runTransformHtmlChain(landingHtml, landingContext);
    // The landing page always owns `/`. At a root deployment the docs index
    // would collide with it, so the index write above is skipped there — the
    // docs root page simply does not exist.
    await writeFile(join(DIST_DIR, "index.html"), landingHtml);
  }

  // The 404 page is always Flame's. By default it is the dist-root fallback;
  // when the project brings its own pages it moves inside the docs prefix so
  // it never replaces the project's own root 404. A docs page authored as
  // `docs/404.mdx` already sits at that path under the flag, and wins.
  const docsOwnsNotFound = bringOwnPages && mdxFiles.some((f) => f.path === "404");
  let notFoundHtml: string | undefined;
  if (docsOwnsNotFound) {
    logger.warn(`docs/404 is published at ${notFoundPath()}, so the generated 404 page is skipped`);
  } else {
    const notFoundPage = React.createElement(NotFoundPage);
    const notFoundFavicon = docuConfig.meta?.favicon || defaultFavicon();
    const notFoundNonce = generateNonce();
    const notFoundContext: PageContext = {
      pageType: "notFound",
      assets: assetManifest.notFound,
      slug: "404",
      filePath: join(PAGES_DIR, "404.tsx"),
      frontmatter: {},
      config: docuConfig,
    };
    notFoundHtml = htmlShell({
      title: "404 - Not Found",
      description: "",
      body: renderToString(notFoundPage),
      favicon: notFoundFavicon,
      headExtra: [
        '<meta name="robots" content="noindex,follow">',
        ...(builder?.collectHead(notFoundContext) ?? []),
      ],
      bodyExtra: builder?.collectBody(notFoundContext),
      csp: cspHeader(notFoundNonce),
      css: notFoundContext.assets.css,
      js: notFoundContext.assets.js,
      nonce: notFoundNonce,
      themeCss: inlineThemeCss,
      // Served as the static-host fallback at ANY requested path — relative
      // depth can never be right there, so use root-absolute asset URLs.
      absoluteAssets: true,
      basePath: servedBasePath(),
      bundlePath: bundlePath(),
      deployPath: deployPath(),
    });
    if (builder) notFoundHtml = await builder.runTransformHtmlChain(notFoundHtml, notFoundContext);
    const notFoundOut = join(DIST_DIR, notFoundPath().slice(1));
    await mkdir(dirname(notFoundOut), { recursive: true });
    await writeFile(notFoundOut, notFoundHtml);
  }
  if (bringOwnPages && DOCS_OUT_DIR !== DIST_DIR) {
    // The root 404 is the project's — except in a standalone deploy, where the
    // host has no other pages and only honors a root `404.html`. Either 404
    // page (generated, or authored as `docs/404.mdx`) uses root-absolute asset
    // URLs, so the same file works from either location.
    const rootNotFound = join(DIST_DIR, "404.html");
    const prefixedNotFound = join(DIST_DIR, notFoundPath().slice(1));
    if (standaloneRoot() && notFoundHtml) {
      await writeFile(rootNotFound, notFoundHtml);
    } else if (standaloneRoot() && existsSync(prefixedNotFound)) {
      await copyFile(prefixedNotFound, rootNotFound);
    } else {
      await rm(rootNotFound, { force: true });
    }
  }

  logger.spinner.stop(
    `Built ${built} pages (${skipped} cached) \x1b[90m(${Math.round(performance.now() - t)}ms)\x1b[0m`
  );

  if (builder) {
    const pages: PageMeta[] = mdxFiles.map((f) => ({
      slug: f.path,
      title: f.path.split("/").pop() || f.path,
      filePath: join(DOCS_DIR, f.path),
      outputPath: join(DOCS_OUT_DIR, `${f.path}.html`),
    }));
    await builder.runOnEnd(pages, { assetManifest, outDir: DIST_DIR, assetsDir: ASSETS_DIR });
  }

  logger.indexStart();
  t = performance.now();
  // No content changed (all pages cached) → the aggregated index is
  // unchanged too; reuse the existing file instead of regenerating it.
  const indexSkipped = built === 0 && existsSync(join(ASSETS_DIR, "search-index.json"));
  const indexCount = indexSkipped ? 0 : await generateSearchIndex();
  logger.indexDone(indexCount, Math.round(performance.now() - t), indexSkipped);

  logger.routes();
  console.log("");

  await writeCache(cache);

  if (errors.length > 0) {
    console.error(`\n\u274C Build completed with ${errors.length} error(s)\n`);
    process.exit(1);
  }
}

if (!process.env.VITEST) {
  initSentry()
    .then(() => build())
    .catch((err) => {
      captureException(err);
      console.error("Build failed:", err);
      process.exit(1);
    });
}
