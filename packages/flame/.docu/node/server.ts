import { statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { watch } from "node:fs";
import React from "react";
import { renderToString } from "react-dom/server";
import { getContentType } from "./utils";
import { compileMdx } from "./mdx";
import { DOCS_DIR, DIST_DIR, PAGES_DIR, PROJECT_ROOT, loadDocuConfig } from "./paths";
import DocsPage from "../pages/docs/[[...slug]]";
import NotFoundPage from "../pages/404";
import IndexPage from "../pages/index";
import { DocsLayout } from "../components/DocsLayout";
import { buildClientBundle, computeInlineThemeCss } from "./hydrate";
import { generateSearchIndex } from "./search-indexer";
import { logger } from "./logger";
import { initSentry, captureException } from "./sentry";
import { SECURITY_HEADERS, generateNonce, isPathSafe, isSlugSafe, htmlResponse } from "./security";
import { htmlShell as createHtmlShell, hmrScript } from "./html";

const docuConfig = loadDocuConfig();

const PORT = process.env.PORT ?? "3000";

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

function createHtmlResponse(
  title: string,
  description: string,
  body: string,
  status = 200
): Response {
  const nonce = generateNonce();
  const favicon = docuConfig.meta?.favicon || "/favicon.ico";
  const html = createHtmlShell({
    title,
    description,
    body,
    favicon,
    css: assetManifest.css,
    js: assetManifest.js,
    nonce,
    extraScripts: hmrScript(nonce),
    themeCss: inlineThemeCss,
  });
  return htmlResponse(html, nonce, status, process.env.NODE_ENV !== "production");
}

async function getDocsForSlug(slug: string) {
  if (!isSlugSafe(slug, DOCS_DIR)) return null;

  const paths = [
    join(DOCS_DIR, slug, "index.mdx"),
    join(DOCS_DIR, `${slug}.mdx`),
    join(DOCS_DIR, slug, "index.md"),
    join(DOCS_DIR, `${slug}.md`),
  ];

  let filePath: string | null = null;
  let raw: string | null = null;
  for (const p of paths) {
    if (!p.startsWith(DOCS_DIR)) continue;
    try {
      raw = await readFile(p, "utf-8");
      filePath = p;
      break;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    }
  }
  if (!filePath || !raw) return null;

  const relPath = filePath.replace(PROJECT_ROOT + "/", "");
  const result = await compileMdx(raw, relPath);

  return {
    content: result.content,
    compiledSource: result.compiledSource,
    frontmatter: result.frontmatter,
    tocs: result.tocs,
    filePath: relPath,
  };
}

async function handleDocsIndex(): Promise<Response> {
  const doc = await getDocsForSlug("");
  if (!doc) return renderPage(NotFoundPage, "404 - Not Found", "", 404);

  const title = doc.frontmatter.title || "Docs";
  const description = doc.frontmatter.description || "";

  const page = React.createElement(
    DocsLayout,
    { repoUrl: docuConfig.repo?.url, pathname: "/docs" },
    React.createElement(DocsPage, {
      slug: [],
      title,
      description,
      date: doc.frontmatter.date,
      content: doc.content,
      tocs: doc.tocs,
      filePath: doc.filePath,
      repoUrl: docuConfig.repo?.url,
      compiledSource: doc.compiledSource,
    })
  );

  const body = renderToString(page);
  return createHtmlResponse(title, description, body);
}

async function handleDocsRoute(slug: string[]): Promise<Response> {
  const path = slug.join("/");

  const doc = await getDocsForSlug(path);
  if (!doc) return renderPage(NotFoundPage, "404 - Not Found", "", 404);

  const title = doc.frontmatter.title || path;
  const description = doc.frontmatter.description || "";

  const page = React.createElement(
    DocsLayout,
    { repoUrl: docuConfig.repo?.url, pathname: `/docs/${path}` },
    React.createElement(DocsPage, {
      slug,
      title,
      description,
      date: doc.frontmatter.date,
      content: doc.content,
      tocs: doc.tocs,
      filePath: doc.filePath,
      repoUrl: docuConfig.repo?.url,
      compiledSource: doc.compiledSource,
    })
  );

  const body = renderToString(page);
  return createHtmlResponse(title, description, body);
}

function renderPage(
  Component: React.ComponentType<Record<string, unknown>>,
  title: string,
  description: string,
  status: number,
  props: Record<string, unknown> = {}
): Response {
  const page = React.createElement(
    DocsLayout,
    { repoUrl: docuConfig.repo?.url, pathname: "/docs" },
    React.createElement(Component, props)
  );
  const body = renderToString(page);
  return createHtmlResponse(title, description, body, status);
}

function handleIndex(): Response {
  const page = React.createElement(IndexPage);
  const body = renderToString(page);
  return createHtmlResponse(
    docuConfig.meta?.title || "DocuBook",
    docuConfig.meta?.description || "",
    body
  );
}

function serveStatic(pathname: string): Response | null {
  if (!isPathSafe(pathname, DIST_DIR)) return null;
  const decoded = decodeURIComponent(pathname);
  const assetPath = resolve(DIST_DIR, decoded.slice(1));
  try {
    const s = statSync(assetPath);
    if (s.isFile()) {
      return new Response(Bun.file(assetPath), {
        headers: { "Content-Type": getContentType(pathname) },
      });
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }

  if (decoded.startsWith("/docs/assets/")) {
    const docsAsset = resolve(DOCS_DIR, "assets", decoded.replace("/docs/assets/", ""));
    const docsAssetsDir = resolve(DOCS_DIR, "assets");
    const docsAssetsDirSlash = docsAssetsDir.endsWith("/") ? docsAssetsDir : docsAssetsDir + "/";
    if (docsAsset !== docsAssetsDir && !docsAsset.startsWith(docsAssetsDirSlash)) return null;
    try {
      const s = statSync(docsAsset);
      if (s.isFile()) {
        return new Response(Bun.file(docsAsset), {
          headers: { "Content-Type": getContentType(pathname) },
        });
      }
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    }
  }
  return null;
}

const server = Bun.serve({
  port: PORT,
  development: true,
  idleTimeout: 255,

  async fetch(req) {
    const url = new URL(req.url);
    const pathname = url.pathname;
    const startTime = performance.now();

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
            response = await handleDocsIndex();
          } else {
            response = await handleDocsRoute(slug);
          }
        } else if (routeName === "/404") {
          response = renderPage(NotFoundPage, "404 - Not Found", "", 404);
        } else if (routeName === "/") {
          response = handleIndex();
        } else {
          response = renderPage(NotFoundPage, "404 - Not Found", "", 404);
        }
      } else {
        response = renderPage(NotFoundPage, "404 - Not Found", "", 404);
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
      const message = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack || "" : "";
      logger.request(req.method, pathname, 500, Math.round(performance.now() - startTime));
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Error</title>
<style>body{margin:0;padding:2rem;font-family:ui-monospace,monospace;background:#1a1a2e;color:#e0e0e0}
h1{color:#ff6b6b}pre{background:#0d0d1a;border:1px solid #333;border-radius:8px;padding:1.5rem;overflow-x:auto;font-size:14px;line-height:1.6;white-space:pre-wrap;word-break:break-word}
.msg{color:#ff6b6b;font-weight:bold}</style></head><body>
<h1>🔥 Server Error</h1>
<pre><span class="msg">${Bun.escapeHTML(message)}</span>\n\n${Bun.escapeHTML(stack)}</pre></body></html>`;
      return new Response(html, {
        status: 500,
        headers: {
          "Content-Type": "text/html",
          ...SECURITY_HEADERS,
          "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
        },
      });
    }
  },

  error(error) {
    console.error(error);
    captureException(error);
    const msg = Bun.escapeHTML(error?.message || "Unknown error");
    const stack = Bun.escapeHTML(error?.stack || "");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Error</title>
<style>body{margin:0;padding:2rem;font-family:ui-monospace,monospace;background:#1a1a2e;color:#e0e0e0}
h1{color:#ff6b6b}pre{background:#0d0d1a;border:1px solid #333;border-radius:8px;padding:1.5rem;overflow-x:auto;font-size:14px;line-height:1.6;white-space:pre-wrap;word-break:break-word}
.msg{color:#ff6b6b;font-weight:bold}</style></head><body>
<h1>🔥 Server Error</h1>
<pre><span class="msg">${msg}</span>\n\n${stack}</pre></body></html>`;
    return new Response(html, {
      status: 500,
      headers: {
        "Content-Type": "text/html",
        ...SECURITY_HEADERS,
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
      },
    });
  },
});

logger.ready(server.port!, true);
