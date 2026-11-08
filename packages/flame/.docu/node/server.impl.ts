/**
 * Runtime-neutral dev server — mirror of `server.ts` (Bun-only, protected)
 * driven by a `RuntimeAdapter` (./runtime) instead of `Bun.serve`,
 * with manual route matching instead of `Bun.FileSystemRouter`. The page set
 * is static (`/`, `/docs/[[...slug]]`, `/404`), so a router is unnecessary.
 */

import { watch } from "node:fs";
import type { RuntimeAdapter, ServerHandle } from "./runtime";
import {
  DOCS_DIR,
  loadDocuConfig,
  resolveBasePath,
  assertValidBasePath,
  assertValidExperimental,
  resolveOwnPages,
  resolveRootRoute,
  bundlePath,
} from "./paths";
import { loadPlugins } from "./plugin-loader";
import { BuildPluginBuilder } from "./plugin-builder";
import { buildClientBundle, computeInlineThemeCss } from "./hydrate.node";
import { generateSearchIndex } from "./search-indexer";
import { logger } from "./logger";
import {
  DEV_RESTART_EXIT_CODE,
  DEV_SUPERVISED_ENV,
  resolveWorkspacePackages,
  watchWorkspacePackages,
} from "./dev-watch";
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
import { redirectResponse, scanMdxFiles, resolveDocsIndexSource } from "./server-utils";
import { findMissingRouteTargets, missingRoutesWarning } from "./route-check";
import { matchDocsSlug, stripDocsHtmlSuffix } from "./utils";

export async function runServer(adapter: RuntimeAdapter): Promise<ServerHandle> {
  const docuConfig = loadDocuConfig();
  const resolvedBasePath = resolveBasePath(docuConfig);
  const rootRoute = resolveRootRoute(resolveOwnPages(docuConfig), resolvedBasePath);

  // Report normalized prefixes (and stop on a value that cannot be honored)
  // before the server announces a site that would be built somewhere else.
  for (const warning of assertValidBasePath()) logger.warn(warning.message);
  for (const warning of assertValidExperimental()) logger.warn(warning.message);
  // Broken sidebar entries in docu.json (a renamed or deleted page): checked once
  // at startup, the same check the build runs.
  {
    const routesWarning = missingRoutesWarning(
      findMissingRouteTargets(
        docuConfig.routes,
        (await scanMdxFiles(DOCS_DIR)).map((f) => f.path),
        Boolean(resolveDocsIndexSource(DOCS_DIR)),
        { separator: docuConfig.sidebar?.context === "separator" }
      )
    );
    if (routesWarning) logger.warn(routesWarning);
  }

  const parsedPort = parseInt(process.env.PORT ?? "3000", 10);
  const PORT =
    Number.isInteger(parsedPort) && parsedPort > 0 && parsedPort <= 65535 ? parsedPort : 3000;

  logger.buildStart();

  await initSentry();

  logger.bundleStart();
  let t = performance.now();
  const assetManifest = await buildClientBundle({}, { dev: true });
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
    await builder.runOnStart();
  }

  const state: ServerState = {
    docuConfig,
    assetManifest,
    inlineThemeCss,
    builder,
  };

  const hmrClients = new Set<ReadableStreamDefaultController>();

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

  // Workspace-linked @docubook packages are loaded from their built dist by
  // both the server renderer and the client bundle, so a rebuild needs a fresh
  // process: exit with DEV_RESTART_EXIT_CODE and let the supervisor respawn.
  const stopPackageWatch = watchWorkspacePackages(resolveWorkspacePackages(), (pkg) => {
    if (process.env[DEV_SUPERVISED_ENV] === "1") {
      logger.warn(`[dev] ${pkg.name} rebuilt — restarting the dev server`);
      watcher.close();
      stopPackageWatch();
      process.exit(DEV_RESTART_EXIT_CODE);
    }
    logger.warn(`[dev] ${pkg.name} rebuilt — restart \`flame dev\` to load it`);
  });

  process.on("SIGINT", () => {
    watcher.close();
    stopPackageWatch();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    watcher.close();
    stopPackageWatch();
    process.exit(0);
  });

  let handle: ServerHandle | null = null;

  const fetchHandler = async (req: Request): Promise<Response> => {
    const url = new URL(req.url);
    // Generated links carry `.html` (matching the static build output);
    // route them to the same handler as their extensionless form.
    const pathname = stripDocsHtmlSuffix(url.pathname, resolvedBasePath);
    const startTime = performance.now();

    if (builder) {
      const pluginResponse = await builder.runHandleRequest(req, {
        port: handle?.port ?? PORT,
        hostname: handle?.hostname ?? "localhost",
        assetManifest: state.assetManifest,
        assetsPath: bundlePath(),
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

      // `/` follows the build (see resolveRootRoute): the landing page owns it
      // by default — at the deployment root (`meta.basePath: ""`) the build
      // skips the docs index for that reason, so dev must not serve it either.
      // When the project brings its own pages there is no landing page: the
      // docs index takes `/` at the root, and at any other prefix the browser
      // is sent to the docs, since the project's pages are not served here.
      // Static assets were already handled above, so a root deployment may
      // still match every other path as a docs route.
      if (pathname === "/") {
        if (rootRoute === "landing") response = await handleIndex(state);
        else if (rootRoute === "docs-index") response = await handleDocsIndex(state);
        else response = redirectResponse(rootRoute.redirect);
      } else {
        const docsSlug = matchDocsSlug(pathname, resolvedBasePath);
        if (docsSlug) {
          response =
            docsSlug.length === 0
              ? await handleDocsIndex(state)
              : await handleDocsRoute(docsSlug, state);
        } else {
          response = await handleNotFound(state);
        }
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
