import { existsSync } from "node:fs";
import { resolve } from "node:path";

const DIST_DIR = resolve("./.docu/dist");
const PORT = process.env.PORT || "4173";

if (!existsSync(DIST_DIR)) {
  console.error("Error: dist not found. Run `bun build` first.");
  process.exit(1);
}

function getContentType(pathname: string): string {
  const ext = pathname.split(".").pop()?.toLowerCase();
  const types: Record<string, string> = {
    html: "text/html",
    css: "text/css",
    js: "application/javascript",
    json: "application/json",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    svg: "image/svg+xml",
    ico: "image/x-icon",
    woff: "font/woff",
    woff2: "font/woff2",
  };
  return types[ext || ""] || "application/octet-stream";
}

function resolveFile(pathname: string): string | null {
  const path = pathname.slice(1);

  if (!path.includes(".")) {
    const withIndex = resolve(DIST_DIR, path, "index.html");
    if (existsSync(withIndex)) return withIndex;
    const withHtml = resolve(DIST_DIR, path + ".html");
    if (existsSync(withHtml)) return withHtml;
  }

  const exact = resolve(DIST_DIR, path);
  if (existsSync(exact)) return exact;
  return null;
}

const notFoundPath = resolve(DIST_DIR, "404.html");

const server = Bun.serve({
  port: PORT,

  fetch(req) {
    const url = new URL(req.url);
    let pathname = url.pathname;

    if (pathname === "/") pathname = "/docs/";

    const filePath = resolveFile(pathname);
    if (filePath) {
      return new Response(Bun.file(filePath), {
        headers: { "Content-Type": getContentType(filePath) },
      });
    }

    if (existsSync(notFoundPath)) {
      return new Response(Bun.file(notFoundPath), {
        status: 404,
        headers: { "Content-Type": "text/html" },
      });
    }

    return new Response("404 - Not Found", { status: 404 });
  },
});

console.log(`\u279C  DocuBook Preview: http://localhost:${server.port}/docs/`);
console.log("  Serving static files from .docu/dist/\n");
