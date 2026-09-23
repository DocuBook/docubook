export { cn, parseDate, formatDate, formatDate2 } from "@docubook/core";

import { existsSync } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { basePath, DEFAULT_BASE_PATH } from "./paths";

export interface ScannedMdxFile {
  path: string;
  absPath: string;
  mtime: number;
}

/**
 * Scan a directory recursively for MDX/MD files.
 * Skips "assets" directories, hidden directories (dot-prefixed), and root-level
 * index.mdx/index.md (the docs root renders separately in build).
 * Shared between build.ts and search-indexer.ts.
 */
export async function scanMdxFiles(dir: string, baseDir = ""): Promise<ScannedMdxFile[]> {
  const files: ScannedMdxFile[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relativePath = baseDir ? `${baseDir}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      if (entry.name === "assets" || entry.name.startsWith(".")) continue;
      files.push(...(await scanMdxFiles(fullPath, relativePath)));
    } else if (entry.name.endsWith(".mdx") || entry.name.endsWith(".md")) {
      // Root index renders separately (either extension) — scanning it would
      // produce a duplicate "index" page colliding with dist/docs/index.html.
      if (!baseDir && (entry.name === "index.mdx" || entry.name === "index.md")) continue;
      const stats = await stat(fullPath);
      let path = relativePath.replace(/\.(mdx|md)$/, "");

      if (/\/index$/.test(path)) {
        path = path.replace(/\/index$/, "");
      }
      files.push({ path, absPath: fullPath, mtime: stats.mtimeMs });
    }
  }

  return files;
}

export function isExternalUrl(url: string): boolean {
  return /^(https?:\/\/|\/\/)/.test(url);
}

/**
 * Resolve the docs root index source — docs/index.mdx preferred, docs/index.md
 * as fallback (mirrors the dev server's getDocsForSlug extension handling).
 */
export function resolveDocsIndexSource(docsDir: string): string | undefined {
  for (const ext of [".mdx", ".md"]) {
    const candidate = join(docsDir, `index${ext}`);
    if (existsSync(candidate)) return candidate;
  }
  return undefined;
}

/** Default favicon — resolves in both build output (`docs/assets/` is copied
 *  to `<dist>/<basePath>/assets/`) and dev (served from `docs/assets/` via fallback). */
export function defaultFavicon(): string {
  return `${basePath()}/assets/images/favicon.ico`;
}

/**
 * @deprecated Read the value at call time via {@link defaultFavicon} — this
 * constant is frozen at import and cannot follow `meta.basePath`.
 */
export const DEFAULT_FAVICON = "/docs/assets/images/favicon.ico";

/** Join a serve-prefix with a slash-relative path, keeping exactly one slash. */
export function withBasePath(path: string, resolvedBasePath: string = basePath()): string {
  const suffix = path.length === 0 || path === "/" ? "" : `/${path.replace(/^\/+|\/+$/g, "")}`;
  return `${resolvedBasePath}${suffix}`;
}

/** Prefix a root-relative asset path (e.g. `/assets/x.js`) with the base path. */
export function assetHref(assetPath: string, resolvedBasePath: string = basePath()): string {
  return withBasePath(assetPath, resolvedBasePath);
}

/**
 * Apply the base path to a docs route unless it already carries it.
 * Idempotent, which matters because routes are prefixed at more than one
 * layer (nav components, SEO, search indexer) and a route may already be
 * absolute when it reaches us.
 */
export function applyBasePath(path: string, resolvedBasePath: string = basePath()): string {
  if (resolvedBasePath.length === 0) return path;
  if (path === resolvedBasePath || path.startsWith(`${resolvedBasePath}/`)) return path;
  return withBasePath(path, resolvedBasePath);
}

/**
 * Point an author-written root-relative content path at the configured prefix.
 *
 * Authors reference content assets as they appear on disk
 * (`/docs/assets/images/favicon.ico`, `/docs/assets/images/og.png`). When the
 * site is served under a different prefix that leading segment must be
 * rewritten, otherwise the asset 404s at the old path. Paths that already carry
 * the configured prefix, or sit outside the default one, are left untouched.
 */
export function rebaseContentPath(path: string, resolvedBasePath: string = basePath()): string {
  // A path already carrying the configured prefix is final. At the deployment
  // root ("") no path can carry it, so that guard must not swallow the
  // default-prefix rewrite below.
  if (
    resolvedBasePath.length > 0 &&
    (path === resolvedBasePath || path.startsWith(`${resolvedBasePath}/`))
  ) {
    return path;
  }
  // The authored default prefix collapses to the deployment root ("") or is
  // rewritten onto the configured prefix; content assets follow the copy in
  // `<dist>/<prefix>/assets/`, which is the root at a root deployment.
  if (path === DEFAULT_BASE_PATH) return resolvedBasePath || "/";
  if (path.startsWith(`${DEFAULT_BASE_PATH}/`)) {
    return `${resolvedBasePath}${path.slice(DEFAULT_BASE_PATH.length)}`;
  }
  return path;
}

/** Suffix an internal docs link with `.html` to match the flat static build output. */
export function docsHtmlHref(path: string): string {
  return `${path}.html`;
}

/** Map an `/{basePath}` request back to its extensionless route (dev server).
 *  Handles both `/{basePath}/*.html` (pages) and `/{basePath}.html` (the
 *  directory-index edge case), with `basePath` taken from `meta.basePath`. */
export function stripDocsHtmlSuffix(
  pathname: string,
  resolvedBasePath: string = basePath()
): string {
  if (resolvedBasePath.length === 0) {
    // Root deployment: docs live at `/…`, so there is no prefix to match. Only
    // the directory-index edge case can be mapped back safely.
    return pathname === "/index.html" ? "/" : pathname;
  }
  if (pathname === `${resolvedBasePath}.html`) return resolvedBasePath;
  if (pathname.startsWith(`${resolvedBasePath}/`) && pathname.endsWith(".html"))
    return pathname.slice(0, -".html".length);
  return pathname;
}

/**
 * Strip the configured docs prefix from a request path, returning the slug
 * segments. `null` means the request is not a docs route.
 *
 * Root deployments match every request (docs own `/`), so the caller must
 * dispatch `/assets/…` and other static paths to `serveStatic` first — which
 * both dev servers already do.
 */
export function matchDocsSlug(
  pathname: string,
  resolvedBasePath: string = basePath()
): string[] | null {
  if (resolvedBasePath.length === 0) {
    if (pathname !== "/" && pathname.endsWith("/")) return null;
    return pathname === "/" ? [] : pathname.slice(1).split("/").filter(Boolean);
  }
  if (pathname === resolvedBasePath || pathname === `${resolvedBasePath}/`) return [];
  if (pathname.startsWith(`${resolvedBasePath}/`))
    return pathname
      .slice(resolvedBasePath.length + 1)
      .split("/")
      .filter(Boolean);
  return null;
}

export function getPath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch (err) {
    console.error("Failed to parse URL", url, err);
    return url;
  }
}

/** Get git last modified date for a file */
export async function getGitLastModified(filePath: string): Promise<string | null> {
  try {
    const cleanPath = filePath.replace(/^\//, "");
    if (
      !cleanPath ||
      !/^[a-zA-Z0-9\-_/.\s]+$/.test(cleanPath) ||
      /(^|\/)\.\.($|\/)/.test(cleanPath)
    )
      return null;
    const proc = Bun.spawn(["git", "log", "-1", "--format=%cI", "--", cleanPath], {
      stderr: "ignore",
    });
    const text = await new Response(proc.stdout).text();
    const date = text.trim();
    return date || null;
  } catch (err) {
    console.error("Failed to get git last modified for", filePath, err);
    return null;
  }
}

/** Batch git last modified dates for multiple files in a single spawn */
export async function getGitLastModifiedBatch(filePaths: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (filePaths.length === 0) return result;

  // Filter and validate paths — same guard as getGitLastModified
  const safePaths: string[] = [];
  for (const fp of filePaths) {
    const cleanPath = fp.replace(/^\//, "");
    if (
      !cleanPath ||
      !/^[a-zA-Z0-9\-_/.\s]+$/.test(cleanPath) ||
      /(^|\/)\.\.($|\/)/.test(cleanPath)
    ) {
      console.warn(`[utils] getGitLastModifiedBatch: skipping invalid path "${fp}"`);
      continue;
    }
    safePaths.push(cleanPath);
  }

  if (safePaths.length === 0) return result;

  try {
    const proc = Bun.spawn(
      ["git", "log", "--format=%cI", "--name-only", "--diff-filter=ACMR", ...safePaths],
      { stderr: "ignore" }
    );
    const text = await new Response(proc.stdout).text();
    let currentDate = "";

    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
        currentDate = trimmed;
      } else if (currentDate && !result.has(trimmed)) {
        result.set(trimmed, currentDate);
      }
    }
  } catch (err) {
    console.error("Failed to get git last modified batch for", filePaths, err);
  }

  return result;
}

const MIME_TYPES: Record<string, string> = {
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

export function getContentType(pathname: string): string {
  const ext = pathname.split(".").pop()?.toLowerCase();
  return MIME_TYPES[ext || ""] || "application/octet-stream";
}
