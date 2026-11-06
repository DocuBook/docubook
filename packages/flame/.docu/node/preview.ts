import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { logger } from "./logger";
import { DIST_DIR, basePath, ownPages, resolveRootRoute, notFoundPath } from "./paths";
import { getContentType, redirectResponse } from "./server-utils";
import { SECURITY_HEADERS, generateNonce, cspHeader, rotateNonce } from "./security";

const PORT = process.env.PORT || "4173";

logger.buildStart();

if (!existsSync(DIST_DIR)) {
  logger.spinner.start("Checking build output...");
  logger.spinner.info("dist not found. Run \x1b[1mbun run build\x1b[0m first.");
  process.exit(0);
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

// The generated 404 sits at the dist root by default and inside the docs
// prefix under `experimental.pages` (a standalone build has both).
const notFoundFiles = [resolve(DIST_DIR, notFoundPath().slice(1)), resolve(DIST_DIR, "404.html")];
// With `experimental.pages` the dist has no landing page: `/` belongs to the
// project's own pages, which are not in the dist. Unless something was placed
// at `index.html` by hand, send the browser to the docs instead of a 404.
const rootRoute = resolveRootRoute(ownPages(), basePath());

const server = Bun.serve({
  port: PORT,

  async fetch(req) {
    const url = new URL(req.url);
    const pathname = decodeURIComponent(url.pathname);

    const filePath = resolveFile(pathname);

    if (filePath) {
      const contentType = getContentType(filePath);
      if (contentType === "text/html") {
        const nonce = generateNonce();
        const html = await Bun.file(filePath).text();
        const modified = rotateNonce(html, nonce);
        return new Response(modified, {
          headers: {
            "Content-Type": "text/html",
            ...SECURITY_HEADERS,
            "Content-Security-Policy": cspHeader(nonce),
          },
        });
      }
      return new Response(Bun.file(filePath), {
        headers: { "Content-Type": contentType },
      });
    }

    if (pathname === "/" && typeof rootRoute === "object") {
      return redirectResponse(rootRoute.redirect);
    }

    const notFoundFile = notFoundFiles.find((file) => existsSync(file));

    if (notFoundFile) {
      const nonce = generateNonce();
      const html = await Bun.file(notFoundFile).text();
      const modified = rotateNonce(html, nonce);
      return new Response(modified, {
        status: 404,
        headers: {
          "Content-Type": "text/html",
          ...SECURITY_HEADERS,
          "Content-Security-Policy": cspHeader(nonce),
        },
      });
    }

    return new Response("404 - Not Found", { status: 404 });
  },
});

logger.ready(server.port!);
