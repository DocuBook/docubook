import { existsSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { watch } from "node:fs";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  parseMdx,
  extractTocsFromRawMdx,
  extractFrontmatterWithContent,
  createDefaultRehypePlugins,
  createDefaultRemarkPlugins,
} from "@docubook/core";
import { createMdxComponents } from "@docubook/mdx-content";
import { getGitLastModified } from "./utils";
import docuConfig from "../../docu.json" with { type: "json" };
import DocsPage from "../pages/docs/[[...slug]]";
import NotFoundPage from "../pages/404";
import ErrorPage from "../pages/Error";
import IndexPage from "../pages/index";
import { buildClientBundle } from "./hydrate";
import { generateSearchIndex } from "./search-indexer";
import { logger } from "./logger";

const DOCS_DIR = resolve("./docs");
const DIST_DIR = resolve("./.docu/dist");
const PORT = process.env.PORT || "3000";

logger.buildStart();

logger.bundleStart();
let t = performance.now();
const assetManifest = await buildClientBundle();
logger.bundleDone(Math.round(performance.now() - t));

logger.indexStart();
t = performance.now();
const records = await generateSearchIndex();
logger.indexDone(records, Math.round(performance.now() - t));

logger.routes();

const router = new Bun.FileSystemRouter({
  style: "nextjs",
  dir: resolve("./.docu/pages"),
});

const hmrClients = new Set<ReadableStreamDefaultController>();

const HMR_SCRIPT = `<script>
(function(){
  const es = new EventSource("/__hmr");
  es.onmessage = function(e) {
    if (e.data === "reload") window.location.reload();
  };
  es.onerror = function() { es.close(); setTimeout(() => { window.location.reload(); }, 2000); };
})();
</script>`;

let hmrTimeout: ReturnType<typeof setTimeout> | null = null;
watch(DOCS_DIR, { recursive: true }, (_event, filename) => {
  if (!filename || (!filename.endsWith(".mdx") && !filename.endsWith(".md"))) return;
  if (hmrTimeout) clearTimeout(hmrTimeout);
  hmrTimeout = setTimeout(() => {
    for (const client of hmrClients) {
      try {
        client.enqueue(new TextEncoder().encode("data: reload\n\n"));
      } catch {
        hmrClients.delete(client);
      }
    }
  }, 300);
});

function htmlShell(title: string, description: string, body: string): string {
  const favicon = docuConfig.meta?.favicon || "/favicon.ico";
  return `<!DOCTYPE html>
<html data-theme="light" lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="icon" type="image/x-icon" href="${favicon}">
  <link rel="stylesheet" href="/assets/${assetManifest.css}">
</head>
<body>
  <div id="root">${body}</div>
  <script src="/assets/${assetManifest.js}"></script>
  ${HMR_SCRIPT}
</body>
</html>`;
}

function DocsLayout({ children, repoUrl }: { children?: React.ReactNode; repoUrl?: string }) {
  const tocsJson = "[]";
  return React.createElement(
    "div",
    { className: "docs-layout flex flex-col min-h-screen w-full" },
    React.createElement(
      "div",
      { className: "flex flex-1 items-start w-full" },
      // Leftbar (desktop sidebar island)
      React.createElement("aside", {
        id: "sidebar-island",
        className:
          "sticky top-0 hidden h-screen w-[280px] shrink-0 flex-col lg:flex border-r border-base-200 bg-base-100",
        "data-tocs": tocsJson,
        "data-title": "",
        "data-repo": repoUrl || "",
      }),
      // Main area
      React.createElement(
        "main",
        { className: "flex-1 min-w-0 min-h-screen flex flex-col" },
        // DocsNavbar (desktop only)
        React.createElement(
          "div",
          { className: "hidden lg:flex items-center justify-end gap-6 h-14 px-8" },
          React.createElement(
            "nav",
            { className: "flex items-center gap-6 text-sm font-medium text-base-content/80" },
            ...(docuConfig.navbar?.menu || []).map((item: { title: string; href: string }) => {
              const isExternal = /^https?:\/\//.test(item.href);
              return React.createElement(
                "a",
                {
                  key: item.title,
                  href: item.href,
                  className: "flex items-center gap-1 hover:text-base-content transition-colors",
                  ...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {}),
                },
                item.title,
                isExternal
                  ? React.createElement(
                      "svg",
                      {
                        xmlns: "http://www.w3.org/2000/svg",
                        width: "14",
                        height: "14",
                        viewBox: "0 0 24 24",
                        fill: "none",
                        stroke: "currentColor",
                        strokeWidth: "2",
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                      },
                      React.createElement("path", { d: "M7 7h10v10" }),
                      React.createElement("path", { d: "M7 17 17 7" })
                    )
                  : null
              );
            })
          )
        ),
        // Page content
        React.createElement("div", { className: "flex-1 w-full" }, children)
      )
    )
  );
}

async function getDocsForSlug(slug: string) {
  const paths = [
    join(DOCS_DIR, slug, "index.mdx"),
    join(DOCS_DIR, `${slug}.mdx`),
    join(DOCS_DIR, slug, "index.md"),
    join(DOCS_DIR, `${slug}.md`),
  ];

  let filePath: string | null = null;
  for (const p of paths) {
    if (existsSync(p)) {
      filePath = p;
      break;
    }
  }
  if (!filePath) return null;

  const raw = await readFile(filePath, "utf-8");
  const tocs = extractTocsFromRawMdx(raw);
  const { frontmatter, strippedContent } = extractFrontmatterWithContent<{
    title?: string;
    description?: string;
    date?: string;
  }>(raw);

  const components = createMdxComponents();
  const { content } = await parseMdx(strippedContent, {
    components,
    rehypePlugins: createDefaultRehypePlugins(),
    remarkPlugins: createDefaultRemarkPlugins(),
    parseFrontmatter: false,
  });

  const relPath = filePath.replace(resolve("./"), "");
  const date = frontmatter.date || (await getGitLastModified(relPath)) || undefined;
  return { content, frontmatter: { ...frontmatter, date }, tocs, filePath: relPath };
}

async function handleDocsRoute(slug: string[]): Promise<Response> {
  const path = slug.join("/");

  try {
    const doc = await getDocsForSlug(path);
    if (!doc) return renderPage(NotFoundPage, "404 - Not Found", "", 404);

    const title = doc.frontmatter.title || path;
    const description = doc.frontmatter.description || "";

    const page = React.createElement(
      DocsLayout,
      { repoUrl: docuConfig.repo?.url },
      React.createElement(DocsPage, {
        slug,
        title,
        description,
        date: doc.frontmatter.date,
        content: doc.content,
        tocs: doc.tocs,
        filePath: doc.filePath,
        repoUrl: docuConfig.repo?.url,
      })
    );

    const body = renderToString(page);
    const html = htmlShell(title, description, body);
    return new Response(html, { headers: { "Content-Type": "text/html" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return renderPage(ErrorPage, "Error", message, 500, { message });
  }
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
    { repoUrl: docuConfig.repo?.url },
    React.createElement(Component, props)
  );
  const body = renderToString(page);
  const html = htmlShell(title, description, body);
  return new Response(html, { status, headers: { "Content-Type": "text/html" } });
}

function handleIndex(): Response {
  const page = React.createElement(IndexPage);
  const body = renderToString(page);
  const html = htmlShell(
    docuConfig.meta?.title || "DocuBook",
    docuConfig.meta?.description || "",
    body
  );
  return new Response(html, { headers: { "Content-Type": "text/html" } });
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

function serveStatic(pathname: string): Response | null {
  const assetPath = resolve(DIST_DIR, pathname.slice(1));
  try {
    const s = statSync(assetPath);
    if (s.isFile()) {
      return new Response(Bun.file(assetPath), {
        headers: { "Content-Type": getContentType(pathname) },
      });
    }
  } catch {
    /* not found */
  }

  if (pathname.startsWith("/docs/assets/")) {
    const docsAsset = resolve(DOCS_DIR, "assets", pathname.replace("/docs/assets/", ""));
    try {
      const s = statSync(docsAsset);
      if (s.isFile()) {
        return new Response(Bun.file(docsAsset), {
          headers: { "Content-Type": getContentType(pathname) },
        });
      }
    } catch {
      /* not found */
    }
  }
  return null;
}

const server = Bun.serve({
  port: PORT,
  idleTimeout: 255,

  async fetch(req) {
    const url = new URL(req.url);
    const pathname = url.pathname;

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

    const match = router.match(req);

    if (match) {
      const routeName = match.name;

      if (routeName === "/docs/[[...slug]]") {
        const slugParam = match.params?.slug;
        const slug = slugParam ? slugParam.split("/") : [];

        if (slug.length === 0) {
          return handleIndex();
        }

        return handleDocsRoute(slug);
      }

      if (routeName === "/404") {
        return renderPage(NotFoundPage, "404 - Not Found", "", 404);
      }

      if (routeName === "/") {
        return handleIndex();
      }
    }

    return renderPage(NotFoundPage, "404 - Not Found", "", 404);
  },
});

logger.ready(server.port!, true);
