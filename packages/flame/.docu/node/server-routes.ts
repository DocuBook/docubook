import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { readFileSync, statSync } from "node:fs";
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
import { htmlShell as createHtmlShell, hmrScript, errorHtml } from "./html.shared";

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
  state: ServerState,
  depth = 0
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
    depth,
  });
  /** unsafe-eval required by mdx-remote hydration — see build.impl.ts */
  return htmlResponse(html, nonce, status, true);
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
    resolve(DOCS_DIR, slug, "index.mdx"),
    resolve(DOCS_DIR, `${slug}.mdx`),
    resolve(DOCS_DIR, slug, "index.md"),
    resolve(DOCS_DIR, `${slug}.md`),
  ];

  const resolvedDocsDir = resolve(DOCS_DIR);
  let filePath: string | null = null;
  let raw: string | null = null;
  for (const p of paths) {
    const resolvedCandidate = resolve(p);
    if (
      resolvedCandidate !== resolvedDocsDir &&
      !resolvedCandidate.startsWith(resolvedDocsDir + "/")
    ) {
      continue;
    }
    try {
      raw = await readFile(resolvedCandidate, "utf-8");
      filePath = resolvedCandidate;
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
  const title =
    (typeof doc.frontmatter.title === "string" ? doc.frontmatter.title : "") ||
    slug.join("/") ||
    "Docs";
  const description =
    typeof doc.frontmatter.description === "string" ? doc.frontmatter.description : "";

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

  // Match build.ts depth calculation: slug.split("/").length, fallback to 1 for empty
  const depth = slug.length || 1;

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
      depth,
    });
    html = await state.builder.runTransformHtmlChain(html, ctx);
    /** unsafe-eval required by mdx-remote hydration — see build.impl.ts */
    return htmlResponse(html, nonce, 200, true);
  }

  return createHtmlResponse(title, description, body, 200, state, depth);
}

function renderPage(
  Component: React.ComponentType<Record<string, unknown>>,
  title: string,
  description: string,
  status: number,
  state: ServerState,
  props: Record<string, unknown> = {},
  depth = 0
): Response {
  const page = React.createElement(
    DocsLayout,
    { repoUrl: state.docuConfig.repo?.url, pathname: "/docs" },
    React.createElement(Component, props)
  );
  const body = renderToString(page);
  return createHtmlResponse(title, description, body, status, state, depth);
}

export async function handleDocsIndex(state: ServerState): Promise<Response> {
  const doc = await getDocsForSlug("", state);
  if (!doc) return renderPage(NotFoundPage, "404 - Not Found", "", 404, state, {}, 1);
  return renderDocsServerPage(doc, [], "/docs", state);
}

export async function handleDocsRoute(slug: string[], state: ServerState): Promise<Response> {
  const path = slug.join("/");
  const doc = await getDocsForSlug(path, state);
  if (!doc)
    return renderPage(NotFoundPage, "404 - Not Found", "", 404, state, {}, slug.length || 1);
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

export function handleNotFound(state: ServerState, depth = 0): Response {
  return renderPage(NotFoundPage, "404 - Not Found", "", 404, state, {}, depth);
}

export function serveStatic(pathname: string): Response | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (!isPathSafe(decoded, DIST_DIR)) return null;
  const assetPath = resolve(DIST_DIR, decoded.slice(1));
  try {
    const s = statSync(assetPath);
    if (s.isFile()) {
      return new Response(readFileSync(assetPath), {
        headers: { "Content-Type": getContentType(pathname) },
      });
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }

  if (decoded.startsWith("/docs/assets/")) {
    const docsAssetsDir = resolve(DOCS_DIR, "assets");
    const requestedRelative = decoded.slice("/docs/assets/".length);
    const docsAsset = resolve(docsAssetsDir, requestedRelative);
    const docsAssetsDirWithSep = docsAssetsDir.endsWith("/") ? docsAssetsDir : docsAssetsDir + "/";
    if (docsAsset !== docsAssetsDir && !docsAsset.startsWith(docsAssetsDirWithSep)) return null;
    try {
      const s = statSync(docsAsset);
      if (s.isFile()) {
        return new Response(readFileSync(docsAsset), {
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
  const st =
    process.env.NODE_ENV !== "production" && error instanceof Error ? error.stack : undefined;
  return new Response(errorHtml(msg, st), {
    status: 500,
    headers: {
      "Content-Type": "text/html",
      ...SECURITY_HEADERS,
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
    },
  });
}
