import { readFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { statSync } from "node:fs";
import React, { type ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { compileMdx } from "./mdx";
import { getContentType } from "./utils";
import { DOCS_DIR, DIST_DIR, PROJECT_ROOT } from "./paths";
import { BuildPluginBuilder } from "./plugin-builder";
import type { PageContext } from "./plugin";
import type { DocuConfig, TocItem } from "./types";
import DocsPage from "../pages/docs/[[...slug]]";
import NotFoundPage from "../pages/404";
import IndexPage from "../pages/index";
import { DocsLayout } from "../components/DocsLayout";
import { generateNonce, isPathSafe, isSlugSafe, htmlResponse, SECURITY_HEADERS } from "./security";
import { htmlShell as createHtmlShell, hmrScript, errorHtml } from "./html";

export interface ServerState {
  docuConfig: DocuConfig;
  assetManifest: { css: string; js: string };
  inlineThemeCss?: string;
  builder: BuildPluginBuilder | null;
}

function createHtmlResponse(
  title: string,
  description: string,
  body: string,
  status: number,
  state: ServerState
): Response {
  const nonce = generateNonce();
  const favicon = state.docuConfig.meta?.favicon || "/favicon.ico";
  const html = createHtmlShell({
    title,
    description,
    body,
    favicon,
    css: state.assetManifest.css,
    js: state.assetManifest.js,
    nonce,
    extraScripts: hmrScript(nonce),
    themeCss: state.inlineThemeCss,
  });
  return htmlResponse(html, nonce, status, process.env.NODE_ENV !== "production");
}

async function getDocsForSlug(
  slug: string,
  state: ServerState
): Promise<{
  content: ReactNode;
  compiledSource: string;
  frontmatter: Record<string, unknown>;
  tocs: TocItem[];
  filePath: string;
  resolvedContent: string;
} | null> {
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

  let content = raw;
  if (state.builder) {
    const transformed = await state.builder.runOnLoad(relPath, content);
    if (transformed?.contents) {
      content = transformed.contents;
    }
  }

  const remarkPlugins = state.builder?.collectRemarkPlugins();
  const rehypePlugins = state.builder?.collectRehypePlugins();
  const result = await compileMdx(content, relPath, undefined, remarkPlugins, rehypePlugins);

  let frontmatter = result.frontmatter as Record<string, unknown>;
  if (state.builder) {
    frontmatter = await state.builder.runTransformFrontmatterChain(frontmatter, {
      slug: slug || "/",
      filePath: relPath,
      content,
    });
  }

  return {
    content: result.content,
    compiledSource: result.compiledSource,
    frontmatter,
    tocs: result.tocs,
    filePath: relPath,
    resolvedContent: content,
  };
}

async function renderDocsServerPage(
  doc: NonNullable<Awaited<ReturnType<typeof getDocsForSlug>>>,
  slug: string[],
  pathname: string,
  state: ServerState
): Promise<Response> {
  const title = (doc.frontmatter.title as string) || slug.join("/") || "Docs";
  const description = (doc.frontmatter.description as string) || "";

  const page = React.createElement(
    DocsLayout,
    { repoUrl: state.docuConfig.repo?.url, pathname },
    React.createElement(DocsPage, {
      slug,
      title,
      description,
      date: doc.frontmatter.date as string | undefined,
      content: doc.content,
      tocs: doc.tocs,
      filePath: doc.filePath,
      repoUrl: state.docuConfig.repo?.url,
      compiledSource: doc.compiledSource,
    })
  );

  const body = renderToString(page);

  if (state.builder) {
    const ctx: PageContext = {
      slug: slug.join("/") || "/",
      filePath: doc.filePath,
      frontmatter: doc.frontmatter,
      content: doc.resolvedContent,
      config: state.docuConfig,
    };
    const headExtra = state.builder.collectHead(ctx);
    const bodyExtra = state.builder.collectBody(ctx);
    const nonce = generateNonce();
    const favicon = state.docuConfig.meta?.favicon || "/favicon.ico";
    let html = createHtmlShell({
      title,
      description,
      body,
      favicon,
      css: state.assetManifest.css,
      js: state.assetManifest.js,
      nonce,
      extraScripts: hmrScript(nonce),
      themeCss: state.inlineThemeCss,
      headExtra,
      bodyExtra,
    });
    html = await state.builder.runTransformHtmlChain(html, ctx);
    return htmlResponse(html, nonce, 200, process.env.NODE_ENV !== "production");
  }

  return createHtmlResponse(title, description, body, 200, state);
}

function renderPage(
  Component: React.ComponentType<Record<string, unknown>>,
  title: string,
  description: string,
  status: number,
  state: ServerState,
  props: Record<string, unknown> = {}
): Response {
  const page = React.createElement(
    DocsLayout,
    { repoUrl: state.docuConfig.repo?.url, pathname: "/docs" },
    React.createElement(Component, props)
  );
  const body = renderToString(page);
  return createHtmlResponse(title, description, body, status, state);
}

export async function handleDocsIndex(state: ServerState): Promise<Response> {
  const doc = await getDocsForSlug("", state);
  if (!doc) return renderPage(NotFoundPage, "404 - Not Found", "", 404, state);
  return renderDocsServerPage(doc, [], "/docs", state);
}

export async function handleDocsRoute(slug: string[], state: ServerState): Promise<Response> {
  const path = slug.join("/");
  const doc = await getDocsForSlug(path, state);
  if (!doc) return renderPage(NotFoundPage, "404 - Not Found", "", 404, state);
  return renderDocsServerPage(doc, slug, `/docs/${path}`, state);
}

export function handleIndex(state: ServerState): Response {
  const page = React.createElement(IndexPage);
  const body = renderToString(page);
  return createHtmlResponse(
    state.docuConfig.meta?.title || "DocuBook",
    state.docuConfig.meta?.description || "",
    body,
    200,
    state
  );
}

export function handleNotFound(state: ServerState): Response {
  return renderPage(NotFoundPage, "404 - Not Found", "", 404, state);
}

export function serveStatic(pathname: string): Response | null {
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

export function serverErrorResponse(error: unknown): Response {
  const msg = error instanceof Error ? error.message : "Unknown error";
  const st = error instanceof Error ? error.stack : undefined;
  return new Response(errorHtml(msg, st), {
    status: 500,
    headers: {
      "Content-Type": "text/html",
      ...SECURITY_HEADERS,
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
    },
  });
}
