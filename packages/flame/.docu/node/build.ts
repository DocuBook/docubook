import { readFile, writeFile, mkdir, readdir, copyFile, stat } from "node:fs/promises";
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
import { htmlShell as createHtmlShell } from "./html";
import { generateSearchIndex } from "./search-indexer";
import { buildClientBundle } from "./hydrate";
import { logger } from "./logger";
import { initSentry, captureException } from "./sentry";
import type { BuildCache, CliArgs } from "./types";
import DocsPage from "../pages/docs/[[...slug]]";
import IndexPage from "../pages/index";
import NotFoundPage from "../pages/404";
import { DocsLayout } from "../components/DocsLayout";

const docuConfig = loadDocuConfig();

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

async function findMdxFiles(dir: string, baseDir = ""): Promise<{ path: string; mtime: number }[]> {
  const files: { path: string; mtime: number }[] = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = baseDir ? `${baseDir}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        if (entry.name === "assets" || entry.name.startsWith(".")) continue;
        files.push(...(await findMdxFiles(fullPath, relativePath)));
      } else if (entry.name.endsWith(".mdx") || entry.name.endsWith(".md")) {
        if (entry.name === "index.mdx" && !baseDir) continue;
        const stats = await stat(fullPath);
        let path = relativePath.replace(/\.(mdx|md)$/, "");

        if (/\/index$/.test(path)) {
          path = path.replace(/\/index$/, "");
        }
        files.push({ path, mtime: stats.mtimeMs });
      }
    }
  } catch (err) {
    console.error("Failed to scan docs directory:", (err as Error).message);
  }
  return files;
}

function shouldRebuild(path: string, mtime: number, cache: BuildCache): boolean {
  const cached = cache[path];
  if (!cached) return true;
  return mtime > cached.builtAt;
}

let assetManifest = { js: "client.js", css: "client.css" };

function htmlShell(title: string, description: string, body: string): string {
  const favicon = docuConfig.meta?.favicon || "/favicon.ico";
  return createHtmlShell({
    title,
    description,
    body,
    favicon,
    css: assetManifest.css,
    js: assetManifest.js,
  });
}

async function renderDocsPage(
  slug: string,
  rawMdx: string,
  filePath: string,
  gitDates?: Map<string, string>
): Promise<string> {
  let result;
  try {
    result = await compileMdx(rawMdx, filePath, gitDates);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown MDX error";
    throw new Error(`MDX Error in: docs/${slug}.mdx\n${msg}`, { cause: err });
  }

  const title = result.frontmatter.title || slug || "Docs";
  const description = result.frontmatter.description || "";
  const slugParts = slug ? slug.split("/") : [];

  const page = React.createElement(
    DocsLayout,
    { repoUrl: docuConfig.repo?.url },
    React.createElement(DocsPage, {
      slug: slugParts,
      title,
      description,
      date: result.frontmatter.date || undefined,
      content: result.content,
      tocs: result.tocs,
      filePath,
      repoUrl: docuConfig.repo?.url,
      compiledSource: result.compiledSource,
    })
  );

  const body = renderToString(page);
  return htmlShell(title, description, body);
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

  const mdxFiles = await findMdxFiles(DOCS_DIR);
  const cache = args.force ? {} : await readCache();
  let built = 0;
  let skipped = 0;

  logger.bundleStart();
  let t = performance.now();
  assetManifest = await buildClientBundle();
  logger.bundleDone(Math.round(performance.now() - t));

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

  logger.spinner.start("Building pages...");
  t = performance.now();

  const allRelPaths = mdxFiles
    .map((f) => {
      const mdxPath1 = join(DOCS_DIR, f.path, "index.mdx");
      const mdxPath2 = join(DOCS_DIR, `${f.path}.mdx`);
      const mdxPath3 = join(DOCS_DIR, `${f.path}.md`);
      for (const p of [mdxPath1, mdxPath2, mdxPath3]) {
        if (existsSync(p)) return p.replace(PROJECT_ROOT + "/", "");
      }
      return null;
    })
    .filter((p): p is string => p !== null);
  const gitDates = await getGitLastModifiedBatch(allRelPaths);

  const CONCURRENCY = Math.max(1, parseInt(process.env.BUILD_CONCURRENCY || "10", 10) || 10);
  const buildTasks = [];
  const errors: string[] = [];

  for (const file of mdxFiles) {
    const mdxPath1 = join(DOCS_DIR, file.path, "index.mdx");
    const mdxPath2 = join(DOCS_DIR, `${file.path}.mdx`);
    const mdxPath3 = join(DOCS_DIR, `${file.path}.md`);

    let rawMdx: string | null = null;
    let absPath = "";
    for (const p of [mdxPath1, mdxPath2, mdxPath3]) {
      try {
        rawMdx = await readFile(p, "utf-8");
        absPath = p;
        break;
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
      }
    }
    if (!rawMdx) continue;

    let needRebuild = assetsChanged || shouldRebuild(file.path, file.mtime, cache);
    if (!needRebuild) {
      const outputPath = join(DIST_DIR, "docs", `${file.path}.html`);
      if (!existsSync(outputPath)) needRebuild = true;
    }
    if (!needRebuild) {
      skipped++;
      continue;
    }

    const relPath = absPath.replace(PROJECT_ROOT + "/", "");
    const capturedRawMdx = rawMdx;
    const capturedFile = file;

    buildTasks.push(async () => {
      try {
        const html = await renderDocsPage(capturedFile.path, capturedRawMdx, relPath, gitDates);
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
    const indexHtml = await renderDocsPage("", indexRaw, indexRelPath, gitDates);
    await mkdir(join(DIST_DIR, "docs"), { recursive: true });
    await writeFile(join(DIST_DIR, "docs", "index.html"), indexHtml);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`index.mdx: ${msg}`);
    console.error(`\n\u274C Failed to build index: ${msg}\n`);
  }

  const landingPage = React.createElement(IndexPage);
  const landingHtml = htmlShell(
    docuConfig.meta?.title || "DocuBook",
    docuConfig.meta?.description || "",
    renderToString(landingPage)
  );
  await writeFile(join(DIST_DIR, "index.html"), landingHtml);

  const notFoundPage = React.createElement(
    DocsLayout,
    { repoUrl: docuConfig.repo?.url },
    React.createElement(NotFoundPage)
  );
  const notFoundHtml = htmlShell("404 - Not Found", "", renderToString(notFoundPage));
  await writeFile(join(DIST_DIR, "404.html"), notFoundHtml);

  logger.spinner.stop(
    `Built ${built} pages (${skipped} cached) \x1b[90m(${Math.round(performance.now() - t)}ms)\x1b[0m`
  );

  logger.indexStart();
  t = performance.now();
  const indexCount = await generateSearchIndex();
  logger.indexDone(indexCount, Math.round(performance.now() - t));

  logger.routes();
  console.log("");

  await writeCache(cache);

  if (errors.length > 0) {
    console.error(`\n\u274C Build completed with ${errors.length} error(s)\n`);
    process.exit(1);
  }
}

initSentry()
  .then(() => build())
  .catch((err) => {
    captureException(err);
    console.error("Build failed:", err);
    process.exit(1);
  });
