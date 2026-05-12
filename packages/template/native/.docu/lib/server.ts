import { existsSync } from "node:fs";
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
import docuConfig from "../../docu.json" with { type: "json" };
import DocsPage from "../pages/docs/[[...slug]]";
import NotFoundPage from "../pages/404";
import ErrorPage from "../pages/Error";
import IndexPage from "../pages/index";
import { Navbar } from "../components/Navbar";
import { buildClientBundle } from "./hydrate";
import { generateSearchIndex } from "./search-indexer";

const DOCS_DIR = resolve("./docs");
const DIST_DIR = resolve("./.docu/dist");
const PORT = process.env.PORT || "3000";

// Build client assets on startup
await buildClientBundle();
await generateSearchIndex();

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
  es.onerror = function() { setTimeout(() => window.location.reload(), 1000); };
})();
</script>`;

watch(DOCS_DIR, { recursive: true }, () => {
  for (const client of hmrClients) {
    try {
      client.enqueue(new TextEncoder().encode("data: reload\n\n"));
    } catch {
      hmrClients.delete(client);
    }
  }
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
  <link rel="stylesheet" href="/assets/client.css">
</head>
<body>
  <div id="root">${body}</div>
  <script src="/assets/client.js"></script>
  ${HMR_SCRIPT}
</body>
</html>`;
}

function DocsLayout({ children }: { children: React.ReactNode }) {
  return React.createElement(
    "div",
    { className: "flex min-h-screen flex-col" },
    React.createElement(Navbar, {
      logo: docuConfig.navbar?.logo,
      logoText: docuConfig.navbar?.logoText,
      menu: docuConfig.navbar?.menu || [],
    }),
    React.createElement("div", { className: "flex flex-1" }, children)
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

  let mdxComponents = {};
  try {
    mdxComponents = createMdxComponents();
  } catch {
    /* skip */
  }

  const { content } = await parseMdx(strippedContent, {
    components: mdxComponents,
    rehypePlugins: createDefaultRehypePlugins(),
    remarkPlugins: createDefaultRemarkPlugins(),
    parseFrontmatter: false,
  });

  const relPath = filePath.replace(resolve("./"), "");
  return { content, frontmatter, tocs, filePath: relPath };
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
      null,
      React.createElement(DocsPage, {
        slug,
        title,
        description,
        date: doc.frontmatter.date,
        content: doc.content,
        tocs: doc.tocs,
        filePath: doc.filePath,
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
  const page = React.createElement(DocsLayout, null, React.createElement(Component, props));
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
  if (existsSync(assetPath)) {
    return new Response(Bun.file(assetPath), {
      headers: { "Content-Type": getContentType(pathname) },
    });
  }
  if (pathname.startsWith("/docs/assets/")) {
    const docsAsset = resolve(DOCS_DIR, "assets", pathname.replace("/docs/assets/", ""));
    if (existsSync(docsAsset)) {
      return new Response(Bun.file(docsAsset), {
        headers: { "Content-Type": getContentType(pathname) },
      });
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

    if (pathname.startsWith("/assets/") || pathname.includes(".")) {
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
          const firstRoute = docuConfig.routes?.[0];
          const firstItem = firstRoute?.items?.[0];
          const defaultSlug = firstItem
            ? `${firstRoute.href}${firstItem.href}`.replace(/^\//, "")
            : "getting-started/introduction";
          return handleDocsRoute(defaultSlug.split("/"));
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

console.log(`\u279C  DocuBook Dev:   http://localhost:${server.port}/docs/`);
console.log("  HMR enabled \u2014 watching docs/ for changes\n");
