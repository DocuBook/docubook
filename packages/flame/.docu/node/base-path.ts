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
 * Normalize a configured base path into `/prefix` form with no trailing slash.
 * `""` and `"/"` mean "served at the domain root"; a missing value is not
 * handled here — `resolveBasePath` owns the default. Absolute URLs
 * (`https://host/x`) contribute only their pathname, so a `meta.baseURL` can be
 * passed straight in.
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
  if (typeof meta?.basePath !== "string") return DEFAULT_BASE_PATH;
  // Root forms (`""`, `"/"`, `"///"`) stay root. Everything else is
  // canonicalized so routing, output directories and every generated URL agree
  // on one spelling — `"/Docs"` and `"/docs me"` are honored as `"/docs"`
  // and `"/docs-me"` (reported by `validateBasePath`).
  if (normalizeBasePath(meta.basePath) === "") return "";
  return canonicalBasePath(meta.basePath) || DEFAULT_BASE_PATH;
}

/**
 * Deployment-root path contributed by the host, taken from `meta.baseURL`:
 * `""` when the origin serves the dist at `/`, `/repo` for a GitHub Pages
 * project site (which serves the artifact under `<origin>/repo/`).
 *
 * Distinct from the base path — `basePath` is the prefix *inside* the dist,
 * this is the prefix *above* it. Only root-absolute references need it (the 404
 * fallback and the search index); relative ones line up already because pages
 * and assets share the deployment root.
 */
export function resolveDeployPath(config?: DocuConfig | null): string {
  const raw = config?.meta?.baseURL;
  if (typeof raw !== "string") return "";
  try {
    return normalizeBasePath(new URL(raw).pathname);
  } catch {
    // Not an absolute URL. A root-relative value is still a usable path; a bare
    // hostname without a scheme is a config mistake, not a prefix — ignore it.
    return raw.startsWith("/") ? normalizeBasePath(raw) : "";
  }
}

export interface BasePathIssue {
  /** `error` blocks the build; `warning` only reports. */
  level: "error" | "warning";
  message: string;
}

/**
 * Canonical prefix form: lowercase segments with whitespace collapsed to dashes
 * and characters a static host cannot serve dropped (`"/Docs"` → `"/docs"`,
 * `"/docs me"` → `"/docs-me"`). Structural normalization runs first, so an
 * absolute value (`https://host/x`) works too. Returns `""` when nothing
 * servable is left, which callers treat as a config mistake rather than a
 * silent root deployment.
 */
export function canonicalBasePath(value: string): string {
  const structural = normalizeBasePath(value);
  if (structural === "") return "";
  // Whitespace and unservable characters fold away, then dot segments are
  // dropped: a prefix is a URL path *and* an output directory, so `.`/`..`
  // would either escape the dist or resolve differently than the URL does.
  const cleaned = structural
    .replace(/\s+/g, "-")
    .replace(/[^A-Za-z0-9\-._~/]+/g, "")
    .split("/")
    .filter((segment) => segment.length > 0 && segment !== "." && segment !== "..")
    .join("/")
    .replace(/-{2,}/g, "-")
    .toLowerCase();
  return cleaned.length > 0 ? `/${cleaned}` : "";
}

/**
 * Validate an authored `meta.basePath`.
 *
 * `resolveBasePath` normalizes what a static host cannot serve, so this reports
 * what it had to change instead of blocking the build: only a non-string value
 * (which cannot be normalized) is an error. Warnings name the reasons and the
 * canonical value, so the author can fix `docu.json` and keep the editor schema
 * — which only accepts the canonical form — quiet.
 */
export function validateBasePath(value: unknown): BasePathIssue[] {
  if (value === undefined) return [];
  if (typeof value !== "string") {
    return [
      {
        level: "error",
        message: `must be a string (received ${
          value === null ? "null" : typeof value
        }) — remove it or set "${DEFAULT_BASE_PATH}"`,
      },
    ];
  }

  // `""`, `"/"`, `"///"` and whitespace-only values all mean the deployment
  // root, which is always servable.
  const structural = normalizeBasePath(value);
  if (structural === "") return [];

  const canonical = canonicalBasePath(value);
  if (canonical === "") {
    return [
      {
        level: "warning",
        message: `"${value}" has no characters a static host can serve — falling back to "${DEFAULT_BASE_PATH}"`,
      },
    ];
  }
  if (canonical === structural) return [];

  const segments = structural.replace(/^\/+/, "");
  const reasons: string[] = [];
  if (/\s/.test(segments)) reasons.push("whitespace");
  // Whitespace is already reported above — list only the other unservable
  // characters here, or the message prints a blank `( )`.
  const invalid = [
    ...new Set(segments.replace(/[\s]/g, "").replace(/[A-Za-z0-9\-._~/]/g, "")),
  ].join(" ");
  if (invalid.length > 0) reasons.push(`characters that need percent-encoding (${invalid})`);
  if (segments !== segments.toLowerCase()) reasons.push("non-lowercase letters");
  if (/\.\.|(^|\/)\.(\/|$)|--|\/\//.test(segments))
    reasons.push("dot segments or doubled separators");

  return [
    {
      level: "warning",
      message: `"${value}" ${
        reasons.length > 0 ? `contains ${reasons.join(", ")}` : "is not canonical"
      } — normalized to "${canonical}"; update docu.json to match`,
    },
  ];
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

/**
 * Relative climb from a built page to the dist root — the `../` count the HTML
 * shell needs for bundle assets.
 *
 * A page lands at `<dist>/<basePath>/<slug>.html`, so it reaches the dist root
 * through the slug's own directories plus every prefix segment. The host's
 * deployment path is deliberately not counted: pages and assets share it (both
 * resolve under `<deployPath>/`), so it cancels out of the relative math.
 */
export function docsDepth(slug: string, resolvedBasePath: string = DEFAULT_BASE_PATH): number {
  const pageDirs = slug ? slug.split("/").filter(Boolean).length - 1 : 0;
  const prefixSegments = resolvedBasePath.split("/").filter(Boolean).length;
  return Math.max(0, pageDirs) + prefixSegments;
}
