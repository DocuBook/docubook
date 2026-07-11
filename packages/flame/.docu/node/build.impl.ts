/**
 * Runtime-neutral static build — mirror of `build.ts` (Bun-only via its
 * transitive imports, protected) with the Bun-coupled modules swapped for
 * their neutral counterparts: `html.shared` (pure escaping) and
 * `hydrate.node` (esbuild client bundling). Everything else is identical.
 * The Node/Deno build entries call `runBuildCli()`.
 */

import { readFile, writeFile, mkdir, readdir, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import React from "react";
import { renderToString } from "react-dom/server";
import { compileMdx, getGitLastModifiedBatch } from "./mdx";
import {
  DOCS_DIR,
  DIST_DIR,
  ASSETS_DIR,
  CACHE_FILE,
  DOCS_ASSETS_DIR,
  PROJECT_ROOT,
  loadDocuConfig,
} from "./paths";
import { htmlShell } from "./html.shared";
import { generateSearchIndex } from "./search-indexer";
import { buildClientBundle, computeInlineThemeCss } from "./hydrate.node";
import { logger } from "./logger";
import { initSentry, captureException } from "./sentry";
import { loadPlugins } from "./plugin-loader";
import { BuildPluginBuilder } from "./plugin-builder";
import { scanMdxFiles } from "./utils";
import type { BuildCache, CliArgs } from "./types";
import { generateNonce, cspHeader } from "./security";
import type { PageMeta, PageContext } from "./plugin";
import { buildSeoMeta } from "./seo";
import DocsPage from "../pages/docs/[[...slug]]";
import IndexPage from "../pages/index";
import NotFoundPage from "../pages/404";
import { DocsLayout } from "../components/DocsLayout";

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
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Failed to load build cache:", (err as Error).message);
  }
  return {};
}

async function writeCache(cache: BuildCache): Promise<void> {
  await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
}

function parseConcurrency(): number {
  return Math.max(1, parseInt(process.env.BUILD_CONCURRENCY || "4", 10) || 4);
}

type RebuildDecision = "yes" | "hash_check" | "no";

function shouldRebuild(path: string, mtime: number, cache: BuildCache): RebuildDecision {
  const cached = cache[path];
  if (!cached) return "yes";
  if (mtime > cached.builtAt) return "hash_check";
  return "no";
}

let assetManifest = { js: "client.js", css: "client.css" };

let inlineThemeCss: string | undefined;

async function renderDocsPage(
  docuConfig: ReturnType<typeof loadDocuConfig>,
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
    result = await compileMdx(content, filePath, gitDates, remarkPlugins, rehypePlugins);
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

  const title = (typeof frontmatter.title === "string" ? frontmatter.title : "") || slug || "Docs";
  const description = typeof frontmatter.description === "string" ? frontmatter.description : "";
  const slugParts = slug ? slug.split("/") : [];

  const page = React.createElement(
    DocsLayout,
    { repoUrl: docuConfig.repo?.url },
    React.createElement(DocsPage, {
      slug: slugParts,
      title,
      description,
      date: (frontmatter.date as string) || undefined,
      content: result.content,
      tocs: result.tocs,
      filePath,
      repoUrl: docuConfig.repo?.url,
      compiledSource: result.compiledSource,
    })
  );

  const body = renderToString(page);

  const ctx: PageContext = { slug, filePath, frontmatter, content, config: docuConfig };
  const headExtra = builder?.collectHead(ctx);
  const bodyExtra = builder?.collectBody(ctx);

  const depth = slug ? slug.split("/").length : 1;
  const favicon = docuConfig.meta?.favicon || "/docs/assets/images/favicon.ico";
  const seo = buildSeoMeta(docuConfig, frontmatter, slug || "");
  const csp = cspHeader(nonce, process.env.NODE_ENV !== "production");
  let html = htmlShell({
    title,
    description,
    body,
    favicon,
    seo,
    csp,
    css: assetManifest.css,
    js: assetManifest.js,
    nonce,
    themeCss: inlineThemeCss,
    depth,
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

export async function runBuild(): Promise<void> {
  const docuConfig = loadDocuConfig();
  const args = parseArgs();

  logger.buildStart();

  if (args.clean) {
    const { rm } = await import("node:fs/promises");
    try {
      await rm(DIST_DIR, { recursive: true, force: true });
    } catch (err) {
      console.error("Failed to clean dist directory:", (err as Error).message);
    }
  }

  await mkdir(DIST_DIR, { recursive: true });
  await mkdir(ASSETS_DIR, { recursive: true });

  await copyDirectoryRecursive(DOCS_ASSETS_DIR, join(DIST_DIR, "docs", "assets"));

  const mdxFiles = await scanMdxFiles(DOCS_DIR);
  const cache = args.force ? {} : await readCache();
  let built = 0;
  let skipped = 0;

  logger.bundleStart();
  let t = performance.now();
  assetManifest = await buildClientBundle();
  logger.bundleDone(Math.round(performance.now() - t));

  inlineThemeCss = computeInlineThemeCss();

  const lastManifest = cache["__assets__"];
  const assetsChanged =
    !lastManifest || lastManifest.hash !== `${assetManifest.js}:${assetManifest.css}`;
  if (assetsChanged) {
    cache["__assets__"] = {
      hash: `${assetManifest.js}:${assetManifest.css}`,
      mtime: 0,
      builtAt: Date.now(),
    };
  }

  const pluginsConfig = docuConfig.plugins ?? [];
  const builder = pluginsConfig.length > 0 ? new BuildPluginBuilder(docuConfig) : null;
  if (builder) {
    const plugins = await loadPlugins(pluginsConfig);
    for (const plugin of plugins) {
      await plugin.setup(builder);
    }
    await builder.runOnStart();
  }

  logger.spinner.start("Building pages...");
  t = performance.now();

  const allRelPaths = mdxFiles.map((f) => f.absPath.replace(PROJECT_ROOT + "/", ""));

  const indexMdxFull = join(DOCS_DIR, "index.mdx");
  if (existsSync(indexMdxFull)) {
    allRelPaths.push(indexMdxFull.replace(PROJECT_ROOT + "/", ""));
  }
  const gitDates = await getGitLastModifiedBatch(allRelPaths);

  const CONCURRENCY = parseConcurrency();
  const buildTasks = [];
  const errors: string[] = [];

  for (const file of mdxFiles) {
    const rebuildDecision = shouldRebuild(file.path, file.mtime, cache);

    if (rebuildDecision === "no") {
      const outputPath = join(DIST_DIR, "docs", `${file.path}.html`);
      if (existsSync(outputPath) && !assetsChanged) {
        skipped++;
        continue;
      }
    }

    let rawMdx: string;
    try {
      rawMdx = await readFile(file.absPath, "utf-8");
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
      continue;
    }

    if (rebuildDecision === "hash_check") {
      const contentHash = hashContent(rawMdx);
      const cached = cache[file.path];
      if (cached && cached.hash === contentHash) {
        if (!assetsChanged) {
          const outputPath = join(DIST_DIR, "docs", `${file.path}.html`);
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
          docuConfig,
          capturedFile.path,
          capturedRawMdx,
          relPath,
          gitDates,
          builder,
          pageNonce
        );
        const outputPath = join(DIST_DIR, "docs", `${capturedFile.path}.html`);
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

  try {
    const indexMdxPath = join(DOCS_DIR, "index.mdx");
    const indexRaw = await readFile(indexMdxPath, "utf-8");
    const indexRelPath = indexMdxPath.replace(PROJECT_ROOT + "/", "");
    const indexHtml = await renderDocsPage(
      docuConfig,
      "",
      indexRaw,
      indexRelPath,
      gitDates,
      builder,
      generateNonce()
    );
    await mkdir(join(DIST_DIR, "docs"), { recursive: true });
    await writeFile(join(DIST_DIR, "docs", "index.html"), indexHtml);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`index.mdx: ${msg}`);
    console.error(`\n\u274C Failed to build index: ${msg}\n`);
  }

  const landingPage = React.createElement(IndexPage);
  const landingFavicon = docuConfig.meta?.favicon || "/docs/assets/images/favicon.ico";
  const landingSeo = buildSeoMeta(docuConfig, docuConfig.meta as Record<string, unknown>, "");
  const landingNonce = generateNonce();
  const landingHtml = htmlShell({
    title: docuConfig.meta?.title || "DocuBook",
    description: docuConfig.meta?.description || "",
    body: renderToString(landingPage),
    favicon: landingFavicon,
    seo: landingSeo,
    csp: cspHeader(landingNonce, process.env.NODE_ENV !== "production"),
    css: assetManifest.css,
    js: assetManifest.js,
    nonce: landingNonce,
    themeCss: inlineThemeCss,
  });
  await writeFile(join(DIST_DIR, "index.html"), landingHtml);

  const notFoundPage = React.createElement(
    DocsLayout,
    { repoUrl: docuConfig.repo?.url },
    React.createElement(NotFoundPage)
  );
  const notFoundFavicon = docuConfig.meta?.favicon || "/docs/assets/images/favicon.ico";
  const notFoundNonce = generateNonce();
  const notFoundHtml = htmlShell({
    title: "404 - Not Found",
    description: "",
    body: renderToString(notFoundPage),
    favicon: notFoundFavicon,
    headExtra: ['<meta name="robots" content="noindex,follow">'],
    csp: cspHeader(notFoundNonce, process.env.NODE_ENV !== "production"),
    css: assetManifest.css,
    js: assetManifest.js,
    nonce: notFoundNonce,
    themeCss: inlineThemeCss,
  });
  await writeFile(join(DIST_DIR, "404.html"), notFoundHtml);

  logger.spinner.stop(
    `Built ${built} pages (${skipped} cached) \x1b[90m(${Math.round(performance.now() - t)}ms)\x1b[0m`
  );

  if (builder) {
    const pages: PageMeta[] = mdxFiles.map((f) => ({
      slug: f.path,
      title: f.path.split("/").pop() || f.path,
      filePath: join(DOCS_DIR, f.path),
      outputPath: join(DIST_DIR, "docs", `${f.path}.html`),
    }));
    await builder.runOnEnd(pages);
  }

  logger.indexStart();
  t = performance.now();
  const indexCount = await generateSearchIndex();
  logger.indexDone(indexCount, Math.round(performance.now() - t));

  logger.routes();

  await writeCache(cache);

  if (errors.length > 0) {
    console.error(`\n\u274C Build completed with ${errors.length} error(s)\n`);
    process.exit(1);
  }
}

export async function runBuildCli(): Promise<void> {
  try {
    await initSentry();
    await runBuild();
  } catch (err) {
    captureException(err);
    console.error("Build failed:", err);
    process.exit(1);
  }
}
