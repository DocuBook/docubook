import type { DocuConfig } from "./types";

/**
 * Pure base-path helpers shared by server modules and client-side components.
 *
 * This module MUST stay free of Node built-ins (`node:path`, `node:fs`) and of
 * modules that evaluate them at import time (like `./paths`): it is bundled
 * into the client, where `import.meta.dirname` and `process.cwd()` do not
 * exist. All functions here are string operations over a resolved prefix.
 */

/** Default URL prefix the docs site is served under. Kept as `/docs` so
 * existing deployments keep byte-identical output. */
export const DEFAULT_BASE_PATH = "/docs";

/**
 * Normalize a configured base path into `/prefix` form with no trailing
 * slash. `""`, `"/"`, and undefined all mean "served at the domain root".
 * Absolute URLs (`https://host/x`) contribute only their pathname, so a
 * `meta.baseURL` can be passed straight in.
 */
export function normalizeBasePath(value: string | undefined | null): string {
  if (typeof value !== "string") return DEFAULT_BASE_PATH;
  let path = value.trim();
  if (path.length === 0 || path === "/") return "";
  try {
    if (/^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(path)) path = new URL(path).pathname;
  } catch {
    // malformed URL — fall through and treat the raw value as a path
  }
  path = `/${path.replace(/^\/+|\/+$/g, "")}`;
  return path === "/" ? "" : path;
}

/**
 * Resolve the docs URL prefix from config.
 *
 * An explicit `meta.basePath` wins, including `""` for a root deployment.
 * Otherwise `/docs` (the historical behaviour).
 *
 * Deliberately NOT derived from `meta.baseURL`'s pathname: `baseURL` is the
 * origin + deployment root and `basePath` is the prefix beneath it. Deriving
 * one from the other's pathname double-counts that path — the SEO/canonical
 * builder appends the prefix to `baseURL`, so `baseURL: ".../repo"` deriving
 * `basePath: "/repo"` produced `.../repo/repo/...`. They must be configured
 * independently; the schema documents both.
 */
export function resolveBasePath(config?: DocuConfig | null): string {
  const meta = config?.meta;
  if (typeof meta?.basePath === "string") return normalizeBasePath(meta.basePath);
  return DEFAULT_BASE_PATH;
}

/** Join a serve-prefix with a slash-relative path, keeping exactly one slash. */
export function withBasePath(path: string, resolvedBasePath: string = DEFAULT_BASE_PATH): string {
  const suffix = path.length === 0 || path === "/" ? "" : `/${path.replace(/^\/+|\/+$/g, "")}`;
  return `${resolvedBasePath}${suffix}`;
}

/** Prefix a root-relative asset path (e.g. `/assets/x.js`) with the base path. */
export function assetHref(assetPath: string, resolvedBasePath: string = DEFAULT_BASE_PATH): string {
  return withBasePath(assetPath, resolvedBasePath);
}

/**
 * Apply the base path to a docs route unless it already carries it.
 * Idempotent, which matters because routes are prefixed at more than one
 * layer (nav components, SEO, search indexer) and a route may already be
 * absolute when it reaches us.
 */
export function applyBasePath(path: string, resolvedBasePath: string = DEFAULT_BASE_PATH): string {
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
export function rebaseContentPath(
  path: string,
  resolvedBasePath: string = DEFAULT_BASE_PATH
): string {
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

/** Map an `/{basePath}` request back to its extensionless route (dev server).
 *  Handles both `/{basePath}/*.html` (pages) and `/{basePath}.html` (the
 *  directory-index edge case), with `basePath` taken from `meta.basePath`. */
export function stripDocsHtmlSuffix(
  pathname: string,
  resolvedBasePath: string = DEFAULT_BASE_PATH
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
  resolvedBasePath: string = DEFAULT_BASE_PATH
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
