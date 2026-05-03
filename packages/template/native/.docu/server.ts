/**
 * DocuBook Native Dev Server
 * Static file server with route mapping
 */

import { existsSync, createReadStream } from "node:fs";
import { resolve, join } from "node:path";

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
        <a href="/" class="btn btn-primary">Go Home</a>
      </div>
    </div>
  </div>
</body>
</html>`;
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
    let url = new URL(req.url);
    let pathname = url.pathname;

    // Default to index.html
    if (pathname === "/") pathname = "/index.html";

    // Remove leading slash for file path
    const filePath = resolve(DIST_DIR, pathname.slice(1));

    return serveFile(filePath);
  },
});

console.log(`🚀 DocuBook dev server running at http://localhost:${server.port}`);
console.log(`📁 Serving from: ${DIST_DIR}`);
console.log(`\nPress Ctrl+C to stop\n`);