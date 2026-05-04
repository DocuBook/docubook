import { readFile, writeFile, mkdir, readdir, copyFile, stat } from "node:fs/promises";
import { existsSync, createHash } from "node:fs";
import { resolve, join, dirname } from "node:path";
import docuConfig from "../docu.json" with { type: "json" };
import { getDocDate, parseFrontmatterDate } from "./date";

const DOCS_DIR = resolve("./docs");
const DIST_DIR = resolve("./.docu/dist");
const ASSETS_DIR = resolve("./.docu/dist/assets");
const CACHE_FILE = resolve("./.docu/build-cache.json");

// Types
interface DocuRoute {
  title: string;
  href: string;
  noLink?: boolean;
  items?: DocuRoute[];
}

interface DocuConfig {
  meta: { title: string; description: string; baseURL: string };
  navbar: { logoText: string; menu: { title: string; href: string }[] };
  routes: DocuRoute[];
}

interface BuildCache {
  [path: string]: {
    hash: string;
    mtime: number;
  builtAt: number;
  };
}

interface CliArgs {
  force?: boolean;
  clean?: boolean;
}

// Parse CLI args
function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  return {
    force: args.includes("--force") || args.includes("-f"),
    clean: args.includes("--clean") || args.includes("-c"),
  };
}

// Hash content
function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex").slice(0, 16);
}

// Read/write cache
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

// Flatten routes from docu.json
function flattenRoutes(routes: DocuRoute[]): string[] {
  const paths: string[] = [];
  for (const route of routes) {
    if (route.href && !route.noLink) paths.push(route.href);
    if (route.items) paths.push(...flattenRoutes(route.items));
  }
  return paths;
}

// Recursive find MDX files with timestamps
async function findMdxFilesWithStats(dir: string, baseDir = ""): Promise<{ path: string; mtime: number }[]> {
  const files: { path: string; mtime: number }[] = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = baseDir ? `${baseDir}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        const subFiles = await findMdxFilesWithStats(fullPath, relativePath);
        files.push(...subFiles);
      } else if (entry.name.endsWith(".mdx") && entry.name !== "index.mdx") {
        const stats = await stat(fullPath);
        files.push({
          path: relativePath.replace(".mdx", ""),
          mtime: stats.mtimeMs,
        });
      } else if (entry.name === "index.mdx" && baseDir) {
        const stats = await stat(fullPath);
        files.push({
          path: baseDir,
          mtime: stats.mtimeMs,
        });
      }
    }
  } catch { /** skip */ }
  return files;
}

// Read MDX file
async function readMdxFile(pathName: string): Promise<string | null> {
  const patterns = [
    join(DOCS_DIR, pathName, "index.mdx"),
    join(DOCS_DIR, `${pathName}.mdx`),
  ];
  for (const pattern of patterns) {
    if (existsSync(pattern)) return readFile(pattern, "utf-8");
  }
  return null;
}

// Check if should rebuild (cache invalid)
function shouldRebuild(
  path: string,
  mtime: number,
  cache: BuildCache
): boolean {
  const cached = cache[path];
  if (!cached) return true;

  // Rebuild if file modified after last build
  if (mtime > cached.builtAt) return true;

  return false;
}

// Parse MDX to HTML
async function parseMdxToHtml(raw: string, path: string): Promise<string> {
  let content = raw;
  let frontmatterDate: string | undefined;

  if (raw.startsWith("---")) {
    const end = raw.indexOf("---", 3);
    if (end > 0) {
      frontmatterDate = parseFrontmatterDate(raw);
      content = raw.slice(end + 3);
    }
  }

  let html = content
    .trim()
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold mt-4">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold mt-6">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold">$1</h1>')
    .replace(/`([^`]+)`/g, '<code class="bg-base-300 px-2 py-0.5 rounded">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="link link-primary">$1</a>')
    .replace(/\n\n/g, '</p><p class="mb-4">')
    .replace(/\n/g, "<br>");

  const date = await getDocDate({
    filePath: path,
    frontmatterDate,
  });

  if (date) {
    html += `\n<p class="text-sm text-gray-500 mt-8">${date}</p>`;
  }

  return `<div class="prose max-w-none"><p class="mb-4">${html}</p></div>`;
}

function generateNavLinks(menu: { title: string; href: string }[]): string {
  return menu
    .map((m) => `<li><a href="${m.href}.html">${m.title}</a></li>`)
    .join("");
}

function generateDocHtml(path: string, htmlContent: string): string {
  return `<!DOCTYPE html>
<html data-theme="light" lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${path} | ${docuConfig.meta?.title || "DocuBook"}</title>
  <link rel="stylesheet" href="/assets/daisyui.css">
</head>
<body>
  <div class="flex min-h-screen flex-col">
    <nav class="navbar bg-base-200 px-4">
      <div class="flex-1">
        <a class="btn btn-ghost text-xl" href="/index.html">${docuConfig.navbar?.logoText || "DocuBook"}</a>
      </div>
      <div class="flex-none">
        <ul class="menu menu-horizontal px-1">
          ${generateNavLinks(docuConfig.navbar?.menu || [])}
        </ul>
      </div>
    </nav>
    <main class="flex-1 p-8 max-w-4xl">
      ${htmlContent}
    </main>
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
  <title>${docuConfig.meta?.title || "DocuBook"}</title>
  <link rel="stylesheet" href="/assets/daisyui.css">
</head>
<body>
  <div class="hero min-h-screen bg-base-100">
    <div class="hero-content text-center">
      <div class="max-w-md">
        <h1 class="text-5xl font-bold">${docuConfig.meta?.title || "DocuBook"}</h1>
        <p class="py-6">${docuConfig.meta?.description || "Native static documentation"}</p>
        <a href="/getting-started.html" class="btn btn-primary">Get Started</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// Main build function
async function build() {
  const args = parseArgs();
  const startTime = Date.now();

  // Clean build
  if (args.clean) {
    console.log("🧹 Cleaning dist folder...");
    const { rm } = await import("node:fs/promises");
    try {
      await rm(DIST_DIR, { recursive: true, force: true });
    } catch { /** ignore if doesn't exist */ }
  }

  console.log("🔨 Building DocuBook native static site...");

  await mkdir(DIST_DIR, { recursive: true });
  await mkdir(ASSETS_DIR, { recursive: true });

  // Copy assets
  const daisyuiCssPath = resolve("./node_modules/daisyui/daisyui.css");
  if (existsSync(daisyuiCssPath)) {
    await copyFile(daisyuiCssPath, join(ASSETS_DIR, "daisyui.css"));
    console.log("✅ Copied daisyui.css");
  }

  // Get all MDX files with stats
  const mdxFiles = await findMdxFilesWithStats(DOCS_DIR);
  const mdxPaths = mdxFiles.map((f) => f.path);

  // Route paths from config
  const routePaths = flattenRoutes(docuConfig.routes || []).filter(
    (p) => p.length > 1
  );

  // All paths to build
  const allPaths = [...new Set([...routePaths, ...mdxPaths])];

  // Load cache
  const cache = args.force ? {} : await readCache();

  // Track stats
  let built = 0;
  let skipped = 0;

  console.log(`\n📄 Found ${allPaths.length} pages\n`);

  for (const path of allPaths) {
    const raw = await readMdxFile(path);

    if (!raw) {
      console.log(`  ⚠️ ${path}.html (file not found)`);
      continue;
    }

    const fileInfo = mdxFiles.find((f) => f.path === path);
    const needRebuild = !fileInfo || shouldRebuild(path, fileInfo.mtime, cache);

    if (!needRebuild) {
      // Check if output exists
      const outputPath = join(DIST_DIR, `${path}.html`);
      if (!existsSync(outputPath)) {
        // File was deleted, rebuild
        needRebuild = true;
      }
    }

    if (!needRebuild) {
      skipped++;
      console.log(`  ⏭️  ${path}.html (unchanged)`);
      continue;
    }

    // Build the file
    const htmlContent = await parseMdxToHtml(raw, path);
    const fullHtml = generateDocHtml(path, htmlContent);

    const outputPath = join(DIST_DIR, `${path}.html`);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, fullHtml);

    // Update cache
    const contentHash = hashContent(raw);
    cache[path] = {
      hash: contentHash,
      mtime: fileInfo?.mtime || Date.now(),
      builtAt: Date.now(),
    };

    built++;
    console.log(`  ✅ ${path}.html`);
  }

  // Build index (always rebuild for config changes)
  const indexHtml = generateIndexHtml();
  await writeFile(join(DIST_DIR, "index.html"), indexHtml);
  console.log(`  ✅ index.html`);

  // Update cache
  await writeCache(cache);

  // Summary
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(
    `\n✨ Build complete! ${built} rebuilt, ${skipped} skipped (${elapsed}s)`
  );
}

build().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});