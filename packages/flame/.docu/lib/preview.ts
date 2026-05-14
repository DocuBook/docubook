import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { logger } from "./logger";

const DIST_DIR = resolve("./.docu/dist");
const PORT = process.env.PORT || "4173";

logger.buildStart();

if (!existsSync(DIST_DIR)) {
  logger.spinner.start("Checking build output...");
  logger.spinner.info("dist not found. Run \x1b[1mbun run build\x1b[0m first.");
  process.exit(0);
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
  try {
    if (statSync(exact).isFile()) return exact;
  } catch {
    /* not found */
  }
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

logger.ready(server.port!);
