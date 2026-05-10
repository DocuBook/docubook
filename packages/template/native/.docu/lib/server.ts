import { existsSync } from "node:fs";
import { resolve } from "node:path";

const DIST_DIR = resolve("./.docu/dist");
const PORT = process.env.PORT || "3000";

/** Get content type */
function getContentType(pathname: string): string {
  const ext = pathname.split(".").pop()?.toLowerCase();
  const types: Record<string, string> = {
    html: "text/html",
    css: "text/css",
    js: "application/javascript",
    json: "application/json",
    png: "image/png",
    jpg: "image/jpeg",
    svg: "image/svg+xml",
    ico: "image/x-icon",
  };
  return types[ext || ""] || "application/octet-stream";
}

/** 404 response */
function notFound(): string {
  return `<!DOCTYPE html>
<html data-theme="light" lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 - Page Not Found</title>
  <link rel="stylesheet" href="/assets/daisyui.css">
</head>
<body>
  <div class="hero min-h-screen">
    <div class="hero-content text-center">
      <div class="max-w-md">
        <h1 class="text-6xl font-bold">404</h1>
        <p class="py-4 text-xl">Page not found</p>
        <a href="/docs/" class="btn btn-primary">Go Docs</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/** Resolve file path - handle /docs -> /docs/index.html and /docs/page -> /docs/page.html */
function resolveFilePath(pathname: string): string | null {
  // Remove leading slash
  const path = pathname.slice(1);
  
  // If no extension, try index.html first
  if (!path.includes(".")) {
    const withIndex = resolve(DIST_DIR, path, "index.html");
    if (existsSync(withIndex)) {
      return withIndex;
    }
    // Try with .html extension
    const withHtml = resolve(DIST_DIR, path + ".html");
    if (existsSync(withHtml)) {
      return withHtml;
    }
  }
  
  // Try exact match
  const exactPath = resolve(DIST_DIR, path);
  if (existsSync(exactPath)) {
    return exactPath;
  }
  
  return null;
}

/** Serve file or return 404 */
async function serveFile(filePath: string) {
  if (existsSync(filePath)) {
    const file = Bun.file(filePath);
    return new Response(file, {
      headers: { "Content-Type": getContentType(filePath) },
    });
  }
  return new Response(notFound(), {
    status: 404,
    headers: { "Content-Type": "text/html" },
  });
}

// Start server
const server = Bun.serve({
  port: PORT,

  async fetch(req) {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // Default to docs/index.html
    if (pathname === "/") pathname = "/docs/";

    // Resolve file path
    const filePath = resolveFilePath(pathname);
    if (filePath) {
      return serveFile(filePath);
    }

    return serveFile(resolve(DIST_DIR, "docs", "index.html"));
  },
});

console.log("➜  DocuBook Dev:   http://localhost:" + server.port + "/docs/");
console.log(`\nPress Ctrl+C to stop\n`);