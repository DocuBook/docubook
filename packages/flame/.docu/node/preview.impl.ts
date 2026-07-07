/**
 * Runtime-neutral preview server — mirror of `preview.ts` (Bun-only,
 * protected) driven by a `RuntimeAdapter` and `node:fs` file reads.
 */

import { existsSync, statSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { RuntimeAdapter, ServerHandle } from "@docubook/runt";
import { logger } from "./logger";
import { DIST_DIR } from "./paths";
import { getContentType } from "./utils";
import { SECURITY_HEADERS, generateNonce, cspHeader, injectNonce } from "./security";

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

export async function runPreview(adapter: RuntimeAdapter): Promise<ServerHandle | null> {
  const PORT = parseInt(process.env.PORT || "4173", 10);

  logger.buildStart();

  if (!existsSync(DIST_DIR)) {
    logger.spinner.start("Checking build output...");
    logger.spinner.info("dist not found. Run \x1b[1mflame build\x1b[0m first.");
    process.exit(0);
  }

  const notFoundPath = resolve(DIST_DIR, "404.html");

  const handle = await adapter.serve(
    async (req) => {
      const url = new URL(req.url);
      const pathname = decodeURIComponent(url.pathname);

      const filePath = resolveFile(pathname);

      if (filePath) {
        const contentType = getContentType(filePath);
        if (contentType === "text/html") {
          const nonce = generateNonce();
          const html = await readFile(filePath, "utf-8");
          const modified = injectNonce(html, nonce);
          return new Response(modified, {
            headers: {
              "Content-Type": "text/html",
              ...SECURITY_HEADERS,
              "Content-Security-Policy": cspHeader(nonce, true),
            },
          });
        }
        return new Response(readFileSync(filePath), {
          headers: { "Content-Type": contentType },
        });
      }

      if (existsSync(notFoundPath)) {
        const nonce = generateNonce();
        const html = await readFile(notFoundPath, "utf-8");
        const modified = injectNonce(html, nonce);
        return new Response(modified, {
          status: 404,
          headers: {
            "Content-Type": "text/html",
            ...SECURITY_HEADERS,
            "Content-Security-Policy": cspHeader(nonce, true),
          },
        });
      }

      return new Response("404 - Not Found", { status: 404 });
    },
    { port: PORT }
  );

  logger.ready(handle.port);
  return handle;
}
