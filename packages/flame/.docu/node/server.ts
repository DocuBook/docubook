import { watch } from "node:fs";
import { DOCS_DIR, PAGES_DIR, loadDocuConfig } from "./paths";
import { loadPlugins } from "./plugin-loader";
import { BuildPluginBuilder } from "./plugin-builder";
import { buildClientBundle, computeInlineThemeCss } from "./hydrate";
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

const docuConfig = loadDocuConfig();

const PORT = Number(process.env.PORT ?? 3000);

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
const hasPlugins = !!docuConfig.plugins?.length;
const builder = hasPlugins ? new BuildPluginBuilder(docuConfig) : null;
if (hasPlugins && builder) {
  const plugins = await loadPlugins(docuConfig.plugins!);
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

let router: InstanceType<typeof Bun.FileSystemRouter> | null = null;
try {
  router = new Bun.FileSystemRouter({
    style: "nextjs",
    dir: PAGES_DIR,
  });
} catch (e) {
  logger.warn(`FileSystemRouter failed: ${e instanceof Error ? e.message : String(e)}`);
}

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

process.on("SIGINT", () => {
  watcher.close();
  process.exit(0);
});
process.on("SIGTERM", () => {
  watcher.close();
  process.exit(0);
});

const server = Bun.serve({
  port: PORT,
  development: true,
  idleTimeout: 255,

  async fetch(req) {
    const url = new URL(req.url);
    const pathname = url.pathname;
    const startTime = performance.now();

    if (builder) {
      const serverPort = server.port ?? PORT;
      const serverHostname = server.hostname ?? "localhost";
      const pluginResponse = await builder.runHandleRequest(req, {
        port: serverPort,
        hostname: serverHostname,
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

      const match = router?.match(req);
      let response: Response;

      if (match) {
        const routeName = match.name;

        if (routeName === "/docs/[[...slug]]") {
          const slugParam = match.params?.slug;
          const slug = slugParam ? slugParam.split("/") : [];

          if (slug.length === 0) {
            response = await handleDocsIndex(state);
          } else {
            response = await handleDocsRoute(slug, state);
          }
        } else if (routeName === "/404") {
          response = handleNotFound(state);
        } else if (routeName === "/") {
          response = handleIndex(state);
        } else {
          response = handleNotFound(state);
        }
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
  },

  error(error) {
    console.error(error);
    captureException(error);
    return serverErrorResponse(error);
  },
});

logger.ready(server.port!, true);
