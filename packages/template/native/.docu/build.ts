import { readFile, writeFile, mkdir, readdir, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import docuConfig from "../docu.json" with { type: "json" };
import { getDocDate, parseFrontmatterDate } from "./date";

const DOCS_DIR = resolve("./docs");
const DIST_DIR = resolve("./.docu/dist");
const ASSETS_DIR = resolve("./.docu/dist/assets");

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

function flattenRoutes(routes: DocuRoute[]): string[] {
  const paths: string[] = [];
  for (const route of routes) {
    if (route.href && !route.noLink) paths.push(route.href);
    if (route.items) paths.push(...flattenRoutes(route.items));
  }
  return paths;
}

async function findMdxFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        const subFiles = await findMdxFiles(fullPath);
        files.push(...subFiles.map(f => `${entry.name}/${f}`));
      } else if (entry.name.endsWith(".mdx")) {
        if (entry.name !== "index.mdx") {
          files.push(entry.name.replace(".mdx", ""));
        }
      }
    }
  } catch { /** skip */ }
  return files;
}

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
  return menu.map(m => `<li><a href="${m.href}.html">${m.title}</a></li>`).join("");
}

async function build() {
  console.log("🔨 Building DocuBook native static site...");

  await mkdir(DIST_DIR, { recursive: true });
  await mkdir(ASSETS_DIR, { recursive: true });

  const daisyuiCssPath = resolve("./node_modules/daisyui/daisyui.css");
  if (existsSync(daisyuiCssPath)) {
    await copyFile(daisyuiCssPath, join(ASSETS_DIR, "daisyui.css"));
    console.log("✅ Copied daisyui.css");
  }

  const routePaths = flattenRoutes(docuConfig.routes || []).filter(p => p.length > 1);
  const mdxPaths = await findMdxFiles(DOCS_DIR);
  const allPaths = [...new Set([...routePaths, ...mdxPaths])];
  console.log(`📄 Building ${allPaths.length} pages\n`);

  for (const path of allPaths) {
    const raw = await readMdxFile(path);

    if (!raw) {
      console.log(`  ⚠️ ${path}.html (file not found)`);
      continue;
    }

    const htmlContent = await parseMdxToHtml(raw, path);

    const fullHtml = `<!DOCTYPE html>
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

    const outputPath = join(DIST_DIR, `${path}.html`);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, fullHtml);
    console.log(`  ✅ ${path}.html`);
  }

  const indexHtml = `<!DOCTYPE html>
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
        <a href="/docs/getting-started.html" class="btn btn-primary">Get Started</a>
      </div>
    </div>
  </div>
</body>
</html>`;

  await writeFile(join(DIST_DIR, "index.html"), indexHtml);
  console.log("  ✅ index.html");

  const routesJson = {
    routes: Object.fromEntries(allPaths.map(p => [p, `${p}.html`])),
  };
  await writeFile(join(DIST_DIR, "routes.json"), JSON.stringify(routesJson, null, 2));
  console.log("\n✅ routes.json");

  console.log("\n✨ Build complete! Output in .docu/dist/");
}

build().catch(err => {
  console.error("Build failed:", err);
  process.exit(1);
});