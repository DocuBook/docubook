import { readFile, writeFile, mkdir, readdir, copyFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, join, dirname } from "node:path";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  parseMdx,
  extractTocsFromRawMdx,
  extractFrontmatterWithContent,
  createDefaultRehypePlugins,
  createDefaultRemarkPlugins,
} from "@docubook/core";
import { createMdxComponents } from "@docubook/mdx-content";
import docuConfig from "../../docu.json" with { type: "json" };
import { generateSearchIndex } from "./search-indexer";
import type { BuildCache, CliArgs } from "./types";

import DocsPage from "../pages/docs/[[...slug]]";
import NotFoundPage from "../pages/404";
import IndexPage from "../pages/index";
import { Navbar } from "../components/Navbar";

const DOCS_DIR = resolve("./docs");
const DIST_DIR = resolve("./.docu/dist");
const ASSETS_DIR = resolve("./.docu/dist/assets");
const CACHE_FILE = resolve("./.docu/build-cache.json");
const DOCS_ASSETS_DIR = resolve("./docs/assets");

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
  } catch {
    /* skip */
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
        files.push({ path: relativePath.replace(/\.(mdx|md)$/, ""), mtime: stats.mtimeMs });
      }
    }
  } catch {
    /* skip */
  }
  return files;
}

function shouldRebuild(path: string, mtime: number, cache: BuildCache): boolean {
  const cached = cache[path];
  if (!cached) return true;
  return mtime > cached.builtAt;
}

function htmlShell(title: string, description: string, body: string): string {
  const favicon = docuConfig.meta?.favicon || "/favicon.ico";
  return `<!DOCTYPE html>
<html data-theme="light" lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="icon" type="image/x-icon" href="${favicon}">
  <link rel="stylesheet" href="/assets/globals.css">
</head>
<body>
  <div id="root">${body}</div>
</body>
</html>`;
}

function DocsLayout({ children }: { children: React.ReactNode }) {
  return React.createElement(
    "div",
    { className: "flex min-h-screen flex-col" },
    React.createElement(Navbar, {
      logo: docuConfig.navbar?.logo,
      logoText: docuConfig.navbar?.logoText,
      menu: docuConfig.navbar?.menu || [],
    }),
    React.createElement("div", { className: "flex flex-1" }, children)
  );
}

async function renderDocsPage(slug: string, rawMdx: string, filePath: string): Promise<string> {
  const tocs = extractTocsFromRawMdx(rawMdx);
  const { frontmatter, strippedContent } = extractFrontmatterWithContent<{
    title?: string;
    description?: string;
    date?: string;
  }>(rawMdx);

  let mdxComponents = {};
  try {
    mdxComponents = createMdxComponents();
  } catch {
    /* skip */
  }

  const { content } = await parseMdx(strippedContent, {
    components: mdxComponents,
    rehypePlugins: createDefaultRehypePlugins(),
    remarkPlugins: createDefaultRemarkPlugins(),
    parseFrontmatter: false,
  });

  const title = frontmatter.title || slug;
  const description = frontmatter.description || "";
  const slugParts = slug.split("/");

  const page = React.createElement(
    DocsLayout,
    null,
    React.createElement(DocsPage, {
      slug: slugParts,
      title,
      description,
      date: frontmatter.date,
      content,
      tocs,
      filePath,
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
  const startTime = Date.now();

  if (args.clean) {
    const { rm } = await import("node:fs/promises");
    try {
      await rm(DIST_DIR, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }

  await mkdir(DIST_DIR, { recursive: true });
  await mkdir(ASSETS_DIR, { recursive: true });

  await copyDirectoryRecursive(DOCS_ASSETS_DIR, join(DIST_DIR, "docs", "assets"));

  const mdxFiles = await findMdxFiles(DOCS_DIR);
  const cache = args.force ? {} : await readCache();
  let built = 0;
  let skipped = 0;

  for (const file of mdxFiles) {
    const mdxPath1 = join(DOCS_DIR, file.path, "index.mdx");
    const mdxPath2 = join(DOCS_DIR, `${file.path}.mdx`);
    const mdxPath3 = join(DOCS_DIR, `${file.path}.md`);

    let rawMdx: string | null = null;
    let absPath = "";
    for (const p of [mdxPath1, mdxPath2, mdxPath3]) {
      if (existsSync(p)) {
        rawMdx = await readFile(p, "utf-8");
        absPath = p;
        break;
      }
    }
    if (!rawMdx) continue;

    let needRebuild = shouldRebuild(file.path, file.mtime, cache);
    if (!needRebuild) {
      const outputPath = join(DIST_DIR, "docs", `${file.path}.html`);
      if (!existsSync(outputPath)) needRebuild = true;
    }
    if (!needRebuild) {
      skipped++;
      continue;
    }

    const relPath = absPath.replace(resolve("./"), "");
    const html = await renderDocsPage(file.path, rawMdx, relPath);
    const outputPath = join(DIST_DIR, "docs", `${file.path}.html`);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, html);

    cache[file.path] = { hash: hashContent(rawMdx), mtime: file.mtime, builtAt: Date.now() };
    built++;
  }

  const indexPage = React.createElement(IndexPage);
  const indexBody = renderToString(indexPage);
  const indexHtml = htmlShell(
    docuConfig.meta?.title || "DocuBook",
    docuConfig.meta?.description || "",
    indexBody
  );
  await mkdir(join(DIST_DIR, "docs"), { recursive: true });
  await writeFile(join(DIST_DIR, "docs", "index.html"), indexHtml);

  const notFoundPage = React.createElement(DocsLayout, null, React.createElement(NotFoundPage));
  const notFoundHtml = htmlShell("404 - Not Found", "", renderToString(notFoundPage));
  await writeFile(join(DIST_DIR, "404.html"), notFoundHtml);

  await writeCache(cache);

  const indexCount = await generateSearchIndex();
  console.log("\uD83D\uDD0D Indexed " + indexCount + " search records");

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log("\u2728 Built " + built + " pages (" + skipped + " cached) in " + elapsed + "s");
}

build().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
