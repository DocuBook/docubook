import { readFile, writeFile, mkdir, readdir, copyFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, join, dirname } from "node:path";
import docuConfig from "../../docu.json" with { type: "json" };
import { preRenderer } from "./prerender";
import { buildClientBundle } from "./hydrate";
import { generateSearchIndex } from "./search-indexer";
import type { BuildCache, CliArgs } from "./types";

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
    /** skip */
  }
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
  } catch {
    /** skip */
  }
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
  preRendered: {
    html: string;
    compiledSource: string;
    frontmatter: Record<string, unknown>;
    toc?: { id: string; title: string; level: number }[];
  }
): string {
  const title = String(preRendered.frontmatter.title || path);
  const description = preRendered.frontmatter.description as string | undefined;
  const date = preRendered.frontmatter.date as string | undefined;
  const favicon = docuConfig.meta?.favicon || "/favicon.ico";
  const logo = docuConfig.navbar?.logo;
  const logoText = docuConfig.navbar?.logoText;

  // Logo HTML
  let logoHtml = "";
  if (logo?.src && logoText) {
    logoHtml = `<a href="/docs" class="flex items-center gap-2"><img src="${logo.src}" alt="${logo.alt || logoText}" width="32" height="32"><span class="font-semibold text-lg">${logoText}</span></a>`;
  } else if (logo?.src) {
    logoHtml = `<a href="/docs"><img src="${logo.src}" alt="${logo.alt || "Logo"}" width="24" height="24"></a>`;
  } else if (logoText) {
    logoHtml = `<a href="/docs" class="font-semibold text-xl">${logoText}</a>`;
  }

  // Meta section
  let metaSection = "";
  if (description || date) {
    const descHtml = description ? `<p class="mt-2 text-lg opacity-80">${description}</p>` : "";
    const dateHtml = date ? `<span class="text-sm opacity-60">${date}</span>` : "";
    metaSection = `<div class="mb-6">${descHtml}${dateHtml}</div>`;
  }

  // TOC HTML
  let tocHtml = "";
  if (preRendered.toc && preRendered.toc.length > 0) {
    const tocItems = preRendered.toc
      .filter((item) => item.level > 1)
      .map((item) => `<li><a href="#${item.id}" class="text-sm">${item.title}</a></li>`)
      .join("\n");
    tocHtml = tocItems
      ? `<aside class="hidden lg:block fixed right-8 top-24 w-48"><h4 class="font-semibold mb-2">On this page</h4><ul class="text-base-content/70">${tocItems}</ul></aside>`
      : "";
  }

  return `<!DOCTYPE html>
<html data-theme="light" lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  ${description ? `<meta name="description" content="${description}">` : ""}
  <link rel="icon" type="image/x-icon" href="${favicon}">
  <link rel="stylesheet" href="/assets/daisyui.css">
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@mdx-js/react@3/umd/mdx.cjs" crossorigin></script>
  <script src="/assets/mdx-client.js" crossorigin></script>
</head>
<body>
  <div id="root" data-mdx="${encodeURIComponent(preRendered.compiledSource)}">
    <div class="flex min-h-screen flex-col">
      <!-- Navbar -->
      <nav class="navbar bg-base-200 px-4">
        <div class="flex items-center gap-1.5">
          <a class="btn btn-ghost text-xl" href="/docs/">${logoHtml}</a>
        </div>
        <div class="flex-none">
          <ul class="menu menu-horizontal px-1">
            ${generateNavLinks(docuConfig.navbar?.menu || [])}
          </ul>
        </div>
      </nav>
      
      <!-- Main Content -->
      <main class="flex-1 p-8 max-w-4xl mx-auto relative">
        <h1 class="text-3xl font-bold mb-4">${title}</h1>
        ${metaSection}
        
        <div class="flex gap-8">
          <!-- Article Content (Pre-rendered HTML) -->
          <article class="flex-1">
            ${preRendered.html}
          </article>
          
          <!-- Table of Contents -->
          ${tocHtml}
        </div>
      </main>
      
      <!-- Footer -->
      <footer class="footer footer-center p-4 bg-base-200 text-base-content">
        <div>
          <p class="text-sm opacity-70">
            © ${new Date().getFullYear()} ${docuConfig.meta?.title}. Built with DocuBook.
          </p>
        </div>
      </footer>
    </div>
  </div>
</body>
</html>`;
}

function generateIndexHtml(): string {
  const favicon = docuConfig.meta?.favicon || "/favicon.ico";

  return `<!DOCTYPE html>
<html data-theme="light" lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${docuConfig.meta?.title}</title>
  <link rel="icon" type="image/x-icon" href="${favicon}">
  <link rel="stylesheet" href="/assets/daisyui.css">
</head>
<body>
  <div class="hero min-h-screen bg-base-100">
    <div class="hero-content text-center">
      <div class="max-w-md">
        <h1 class="text-5xl font-bold">${docuConfig.meta?.title}</h1>
        <p class="py-6">${docuConfig.meta?.description}</p>
        <a href="/docs/getting-started/introduction" class="btn btn-primary">Get Started</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function generateNavLinks(menu: { title: string; href: string }[]): string {
  return menu.map((m) => `<li><a href="/docs/${m.href}.html">${m.title}</a></li>`).join("");
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
      /** ignore */
    }
  }

  await mkdir(DIST_DIR, { recursive: true });
  await mkdir(ASSETS_DIR, { recursive: true });

  // Copy daisyUI CSS
  const daisyuiCssPath = resolve("./node_modules/daisyui/daisyui.css");
  if (existsSync(daisyuiCssPath)) {
    await copyFile(daisyuiCssPath, join(ASSETS_DIR, "daisyui.css"));
  }

  // Copy docs/assets/ to dist/docs/assets/
  const docsAssetsDest = join(DIST_DIR, "docs", "assets");
  await copyDirectoryRecursive(DOCS_ASSETS_DIR, docsAssetsDest);

  // Build pages as preRenderer service
  const mdxFiles = await findMdxFilesWithStats(DOCS_DIR);
  const allPaths = mdxFiles.map((f) => f.path);
  const cache = args.force ? {} : await readCache();

  let built = 0;
  let skipped = 0;

  for (const path of allPaths) {
    // Read MDX file
    const mdxPath1 = join(DOCS_DIR, path, "index.mdx");
    const mdxPath2 = join(DOCS_DIR, `${path}.mdx`);

    let rawMdx: string | null = null;
    if (existsSync(mdxPath1)) {
      rawMdx = await readFile(mdxPath1, "utf-8");
    } else if (existsSync(mdxPath2)) {
      rawMdx = await readFile(mdxPath2, "utf-8");
    }

    if (!rawMdx) continue;

    // Check cache
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

    const preRendered = await preRenderer.preRender(rawMdx);
    const fullHtml = generateDocHtml(path, preRendered);
    const outputPath = join(DIST_DIR, "docs", `${path}.html`);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, fullHtml);

    // Update cache
    cache[path] = {
      hash: hashContent(rawMdx),
      mtime: fileInfo?.mtime || Date.now(),
      builtAt: Date.now(),
    };
    built++;
  }

  // Build index
  const indexMdxPath = join(DOCS_DIR, "index.mdx");
  if (existsSync(indexMdxPath)) {
    const indexMdxContent = await readFile(indexMdxPath, "utf-8");
    const preRendered = await preRenderer.preRender(indexMdxContent);
    await writeFile(
      join(DIST_DIR, "docs", "index.html"),
      generateDocHtml("", { ...preRendered, frontmatter: preRendered.frontmatter })
    );
  } else {
    await writeFile(join(DIST_DIR, "docs", "index.html"), generateIndexHtml());
  }

  // Build client bundle for hydration
  await buildClientBundle();
  await writeCache(cache);

  // Generate search index
  const indexCount = await generateSearchIndex();
  console.log("🔍 Indexed " + indexCount + " search records");

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log("✨ Built " + built + " pages (" + skipped + " cached) in " + elapsed + "s");
}

build().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
