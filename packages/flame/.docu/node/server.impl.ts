/**
 * Runtime-neutral dev server — mirror of `server.ts` (Bun-only, protected)
 * driven by a `RuntimeAdapter` (./runtime) instead of `Bun.serve`,
 * with manual route matching instead of `Bun.FileSystemRouter`. The page set
 * is static (`/`, `/docs/[[...slug]]`, `/404`), so a router is unnecessary.
 */

import { watch, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import type { RuntimeAdapter, ServerHandle } from "./runtime";
import { DOCS_DIR, loadDocuConfig } from "./paths";
import { loadPlugins } from "./plugin-loader";
import { BuildPluginBuilder } from "./plugin-builder";
import { buildClientBundle, computeInlineThemeCss } from "./hydrate.node";
import { generateSearchIndex } from "./search-indexer";
import { logger } from "./logger";
import { initSentry, captureException } from "./sentry";
import {
  serveStatic,
  handleDocsIndex,
  handleDocsRoute,
  handleIndex,
  handleNotFound,
  serverErrorResponse,
  type ServerState,
} from "./server-routes";
import { wrapPluginResponse } from "./security";
import { stripDocsHtmlSuffix } from "./utils";

export async function runServer(adapter: RuntimeAdapter): Promise<ServerHandle> {
  const docuConfig = loadDocuConfig();

  const parsedPort = parseInt(process.env.PORT ?? "3000", 10);
  const PORT =
    Number.isInteger(parsedPort) && parsedPort > 0 && parsedPort <= 65535 ? parsedPort : 3000;

  logger.buildStart();

  await initSentry();

  logger.bundleStart();
  let t = performance.now();
  const assetManifest = await buildClientBundle();
  logger.bundleDone(Math.round(performance.now() - t));

  const inlineThemeCss = computeInlineThemeCss();

  logger.indexStart();
  t = performance.now();
  const records = await generateSearchIndex();
  logger.indexDone(records, Math.round(performance.now() - t));

  logger.routes();

  // Plugin setup — all hooks active (onLoad, remark/rehype, frontmatter, head/body, html transform, handleRequest)
  const pluginsConfig = docuConfig.plugins ?? [];
  const builder = pluginsConfig.length > 0 ? new BuildPluginBuilder(docuConfig) : null;

  if (builder) {
    const plugins = await loadPlugins(pluginsConfig);

    for (const plugin of plugins) {
      await plugin.setup(builder);
    }
  }

  const state: ServerState = {
    docuConfig,
    assetManifest,
    inlineThemeCss,
    builder,
  };

  const hmrClients = new Set<ReadableStreamDefaultController>();

  const require = createRequire(import.meta.url);
  /** Locate the installed @docubook/markdown source dir (workspace link), if any. */
  function resolveMdxContentSrc(): string | null {
    try {
      const pkgDir = dirname(require.resolve("@docubook/markdown/package.json"));
      const src = join(pkgDir, "src");
      return existsSync(src) ? src : null;
    } catch {
      return null;
    }
  }

  let hmrTimeout: ReturnType<typeof setTimeout> | null = null;
  const watcher = watch(DOCS_DIR, { recursive: true }, (_event, filename) => {
    if (!filename || (!filename.endsWith(".mdx") && !filename.endsWith(".md"))) return;
    if (hmrTimeout) clearTimeout(hmrTimeout);
    hmrTimeout = setTimeout(() => {
      for (const client of [...hmrClients]) {
        try {
          client.enqueue(new TextEncoder().encode("data: reload\n\n"));
        } catch {
          hmrClients.delete(client);
        }
      }
    }, 300);
  });

  // Rebuild the client bundle when component sources change (e.g. the
  // @docubook/markdown workspace package) so interactive islands pick up
  // edits, then reload connected clients. MDX edits are handled by the watcher
  // above — no rebuild needed, content recompiles per request.
  let srcHmrTimeout: ReturnType<typeof setTimeout> | null = null;
  const mdxContentSrc = resolveMdxContentSrc();
  const srcWatcher = mdxContentSrc
    ? watch(mdxContentSrc, { recursive: true }, (_event, filename) => {
        if (!filename || !/\.(ts|tsx|js|jsx|css)$/.test(filename)) return;
        if (srcHmrTimeout) clearTimeout(srcHmrTimeout);
        srcHmrTimeout = setTimeout(async () => {
          try {
            state.assetManifest = await buildClientBundle();
            logger.warn("[hmr] client bundle rebuilt (component change)");
          } catch (e) {
            logger.warn(
              `[hmr] bundle rebuild failed: ${e instanceof Error ? e.message : String(e)}`
            );
          }
          for (const client of [...hmrClients]) {
            try {
              client.enqueue(new TextEncoder().encode("data: reload\n\n"));
            } catch {
              hmrClients.delete(client);
            }
          }
        }, 300);
      })
    : null;

  process.on("SIGINT", () => {
    watcher.close();
    srcWatcher?.close();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    watcher.close();
    srcWatcher?.close();
    process.exit(0);
  });

  let handle: ServerHandle | null = null;

  const fetchHandler = async (req: Request): Promise<Response> => {
    const url = new URL(req.url);
    // Generated links carry `.html` (matching the static build output);
    // route them to the same handler as their extensionless form.
    const pathname = stripDocsHtmlSuffix(url.pathname);
    const startTime = performance.now();

    if (builder) {
      const pluginResponse = await builder.runHandleRequest(req, {
        port: handle?.port ?? PORT,
        hostname: handle?.hostname ?? "localhost",
      });
      if (pluginResponse) {
        const securedResponse = wrapPluginResponse(pluginResponse, true);
        logger.request(
          req.method,
          pathname,
          securedResponse.status,
          Math.round(performance.now() - startTime)
        );
        return securedResponse;
      }
    }

    try {
      if (pathname === "/__hmr") {
        const stream = new ReadableStream({
          start(controller) {
            hmrClients.add(controller);
            controller.enqueue(new TextEncoder().encode("data: connected\n\n"));
          },
          cancel(controller) {
            hmrClients.delete(controller);
          },
        });
        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      }

      if (pathname.startsWith("/assets/") || /\.\w+$/.test(pathname)) {
        const staticRes = serveStatic(pathname);
        if (staticRes) return staticRes;
      }

      let response: Response;

      // Manual route matching — same routes Bun.FileSystemRouter derives
      // from `.docu/pages/` ("/", "/docs/[[...slug]]", "/404").
      if (pathname === "/") {
        response = handleIndex(state);
      } else if (pathname === "/docs" || pathname === "/docs/") {
        response = await handleDocsIndex(state);
      } else if (pathname.startsWith("/docs/")) {
        const slug = pathname.slice("/docs/".length).split("/").filter(Boolean);
        response =
          slug.length === 0 ? await handleDocsIndex(state) : await handleDocsRoute(slug, state);
      } else {
        response = handleNotFound(state);
      }

      logger.request(
        req.method,
        pathname,
        response.status,
        Math.round(performance.now() - startTime)
      );
      return response;
    } catch (err) {
      captureException(err, { method: req.method, pathname });
      logger.request(req.method, pathname, 500, Math.round(performance.now() - startTime));
      return serverErrorResponse(err);
    }
  };

  handle = await adapter.serve(fetchHandler, { port: PORT, idleTimeout: 255 });

  logger.ready(handle.port, true);
  return handle;
}
