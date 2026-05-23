import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { logger } from "./logger";

const DIST_DIR = resolve("./.docu/dist");
const PORT = process.env.PORT || "4173";

const SECURITY_HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; font-src 'self' data:; connect-src 'self' https:; frame-src https://www.youtube-nocookie.com; frame-ancestors 'none'",
};

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
  const isWithinDist = (p: string) => p === DIST_DIR || p.startsWith(DIST_DIR + "/");

  if (!path.includes(".")) {
    const withIndex = resolve(DIST_DIR, path, "index.html");
    if (isWithinDist(withIndex) && existsSync(withIndex)) return withIndex;
    const withHtml = resolve(DIST_DIR, path + ".html");
    if (isWithinDist(withHtml) && existsSync(withHtml)) return withHtml;
  }

  const exact = resolve(DIST_DIR, path);
  if (!isWithinDist(exact)) return null;
  try {
    if (statSync(exact).isFile()) return exact;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
  return null;
}

const notFoundPath = resolve(DIST_DIR, "404.html");

const server = Bun.serve({
  port: PORT,

  fetch(req) {
    const url = new URL(req.url);
    const pathname = decodeURIComponent(url.pathname);

    const filePath = resolveFile(pathname);
    if (filePath) {
      const contentType = getContentType(filePath);
      const headers: Record<string, string> = { "Content-Type": contentType };
      if (contentType === "text/html") Object.assign(headers, SECURITY_HEADERS);
      return new Response(Bun.file(filePath), { headers });
    }

    if (existsSync(notFoundPath)) {
      return new Response(Bun.file(notFoundPath), {
        status: 404,
        headers: { "Content-Type": "text/html", ...SECURITY_HEADERS },
      });
    }

    return new Response("404 - Not Found", { status: 404 });
  },
});

logger.ready(server.port!);
