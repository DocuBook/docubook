import { readFile, writeFile, mkdir, readdir, copyFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, join, dirname } from "node:path";
import docuConfig from "../docu.json" with { type: "json" };
import { createDocsService } from "./markdown";
import { buildClientBundle } from "./hydrate";
import type { BuildCache, CliArgs } from "./types";

const DOCS_DIR = resolve("./docs");
const DIST_DIR = resolve("./.docu/dist");
const ASSETS_DIR = resolve("./.docu/dist/assets");
const CACHE_FILE = resolve("./.docu/build-cache.json");

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
  } catch { /** skip */ }
  return {};
}

async function writeCache(cache: BuildCache): Promise<void> {
  await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
}

async function findMdxFilesWithStats(
  dir: string,
  baseDir = ""
): Promise<{ path: string; mtime: number }[]> {
  const files: { path: string; mtime: number }[] = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = baseDir ? `${baseDir}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        const folderFiles = await findMdxFilesWithStats(fullPath, relativePath);
        if (folderFiles.length > 0) files.push(...folderFiles);
      } else if (entry.name.endsWith(".mdx")) {
        if (entry.name === "index.mdx" && !baseDir) continue;
        const stats = await stat(fullPath);
        files.push({
          path: relativePath.replace(".mdx", ""),
          mtime: stats.mtimeMs,
        });
      }
    }
  } catch { /** skip */ }
  return files;
}

function shouldRebuild(path: string, mtime: number, cache: BuildCache): boolean {
  const cached = cache[path];
  if (!cached) return true;
  if (mtime > cached.builtAt) return true;
  return false;
}

function generateDocHtml(
  path: string,
  compiledSource: string,
  frontmatter: Record<string, unknown>
): string {
  const title = String(frontmatter.title || path);

  return `<!DOCTYPE html>
<html data-theme="light" lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="/assets/daisyui.css">
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@mdx-js/react@3/umd/mdx.cjs" crossorigin></script>
  <script src="/assets/mdx-client.js" crossorigin></script>
</head>
<body>
  <div id="root" data-mdx="${encodeURIComponent(compiledSource)}">
    <div class="flex min-h-screen flex-col">
      <nav class="navbar bg-base-200 px-4">
        <div class="flex-1">
          <a class="btn btn-ghost text-xl" href="/docs/">${docuConfig.navbar?.logoText}</a>
        </div>
        <div class="flex-none">
          <ul class="menu menu-horizontal px-1">
            ${generateNavLinks(docuConfig.navbar?.menu || [])}
          </ul>
        </div>
      </nav>
      <main class="flex-1 p-8 max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold mb-4">${title}</h1>
        <article class="prose max-w-none" id="mdx-content">
        </article>
      </main>
    </div>
  </div>
</body>
</html>`;
}

function generateIndexHtml(): string {
  return `<!DOCTYPE html>
<html data-theme="light" lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${docuConfig.meta?.title}</title>
  <link rel="stylesheet" href="/assets/daisyui.css">
</head>
<body>
  <div class="hero min-h-screen bg-base-100">
    <div class="hero-content text-center">
      <div class="max-w-md">
        <h1 class="text-5xl font-bold">${docuConfig.meta?.title}</h1>
        <p class="py-6">${docuConfig.meta?.description}</p>
        <a href="/docs/getting-started/introduction.html" class="btn btn-primary">Get Started</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function generateNavLinks(menu: { title: string; href: string }[]): string {
  return menu
    .map((m) => `<li><a href="/docs/${m.href}.html">${m.title}</a></li>`)
    .join("");
}

async function build() {
  const args = parseArgs();
  const startTime = Date.now();

  if (args.clean) {
    const { rm } = await import("node:fs/promises");
    try {
      await rm(DIST_DIR, { recursive: true, force: true });
    } catch { /** ignore */ }
  }

  await mkdir(DIST_DIR, { recursive: true });
  await mkdir(ASSETS_DIR, { recursive: true });

  // Copy daisyUI
  const daisyuiCssPath = resolve("./node_modules/daisyui/daisyui.css");
  if (existsSync(daisyuiCssPath)) {
    await copyFile(daisyuiCssPath, join(ASSETS_DIR, "daisyui.css"));
  }

  // Build pages
  const service = createDocsService();
  const mdxFiles = await findMdxFilesWithStats(DOCS_DIR);
  const allPaths = mdxFiles.map((f) => f.path);
  const cache = args.force ? {} : await readCache();

  let built = 0;
  let skipped = 0;

  for (const path of allPaths) {
    const parsed = await service.getDocForPath(path);
    if (!parsed) continue;

    const fileInfo = mdxFiles.find((f) => f.path === path);
    let needRebuild = !fileInfo || shouldRebuild(path, fileInfo.mtime, cache);

    if (!needRebuild) {
      const outputPath = join(DIST_DIR, "docs", `${path}.html`);
      if (!existsSync(outputPath)) needRebuild = true;
    }

    if (!needRebuild) {
      skipped++;
      continue;
    }

    const fullHtml = generateDocHtml(path, parsed.compiledSource, parsed.frontmatter);
    const outputPath = join(DIST_DIR, "docs", `${path}.html`);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, fullHtml);

    cache[path] = {
      hash: hashContent(parsed.raw),
      mtime: fileInfo?.mtime || Date.now(),
      builtAt: Date.now(),
    };
    built++;
  }

  // Build index
  const indexMdxPath = join(DOCS_DIR, "index.mdx");
  if (existsSync(indexMdxPath)) {
    const indexMdxContent = await readFile(indexMdxPath, "utf-8");
    const parsed = await service.parseMdxFile(indexMdxContent);
    await writeFile(join(DIST_DIR, "docs", "index.html"), generateDocHtml("", parsed.compiledSource, parsed.frontmatter));
  } else {
    await writeFile(join(DIST_DIR, "docs", "index.html"), generateIndexHtml());
  }

  // Build client bundle
  await buildClientBundle();
  await writeCache(cache);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log("✨ Built " + built + " pages (" + skipped + " cached) in " + elapsed + "s");
}

build().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});