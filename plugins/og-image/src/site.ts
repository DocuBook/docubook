/**
 * What the plugin needs to know about the site, derived from `docu.json` the
 * same way flame derives it. `@docubook/flame` has no runtime exports, so the
 * base-path rules are mirrored here; `__tests__/site.test.ts` pins them to
 * flame's own cases.
 */

import { existsSync, statSync } from "node:fs";
import { extname, isAbsolute, join, relative, resolve } from "node:path";
import type { DocuConfig } from "@docubook/flame";
import type { ResolvedOptions } from "./options";
import { isRemoteReference } from "./options";

export const DEFAULT_BASE_PATH = "/docs";

/** Output directory of the cards, below the docs output directory. */
export const CARD_DIR = "assets/og";

export interface Site {
  /** Project root: the directory that holds `docu.json`. */
  root: string;
  /** `<root>/docs`. */
  docsDir: string;
  /** Docs URL prefix: `/docs` by default, `""` at the deployment root. */
  prefix: string;
  /** `meta.baseURL` without a trailing slash, `""` when unset. */
  baseURL: string;
  /** Host and deployment path shown on the card, e.g. `docubook.pro`. */
  domain: string | undefined;
  /** Name in the card's top row. */
  siteName: string;
  /** Flame renders a landing page (`experimental.pages` is off). */
  hasLanding: boolean;
  /** Flame writes the docs index page. */
  hasDocsIndex: boolean;
  /** Sidebar routes from `docu.json`, for the section label. */
  routes: DocuConfig["routes"];
}

/**
 * Strip slashes from the end (and the start, unless `endOnly`) in one linear
 * pass. A `/\/+$/` regex backtracks polynomially on long runs of `/`.
 */
export function trimSlashes(value: string, endOnly = false): string {
  let start = 0;
  let end = value.length;
  if (!endOnly) while (start < end && value[start] === "/") start++;
  while (end > start && value[end - 1] === "/") end--;
  return value.slice(start, end);
}

/** Walk up from `start` to the directory holding `docu.json`, as flame does. */
export function findProjectRoot(start: string = process.cwd()): string {
  let dir = start;
  for (let i = 0; i < 6; i++) {
    if (existsSync(join(dir, "docu.json"))) return dir;
    const parent = resolve(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  return start;
}

/** Mirror of flame's `normalizeBasePath`. */
export function normalizeBasePath(value: string | undefined | null): string {
  if (typeof value !== "string") return DEFAULT_BASE_PATH;
  let path = value.trim();
  if (path.length === 0 || path === "/") return "";
  try {
    if (/^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(path)) path = new URL(path).pathname;
  } catch {
    // malformed URL: treat the raw value as a path
  }
  path = `/${trimSlashes(path)}`;
  return path === "/" ? "" : path;
}

/** Mirror of flame's `canonicalBasePath`. */
export function canonicalBasePath(value: string): string {
  const structural = normalizeBasePath(value);
  if (structural === "") return "";
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

/** Mirror of flame's `resolveBasePath`. */
export function resolveBasePath(config: DocuConfig): string {
  const basePath = config.meta?.basePath;
  if (typeof basePath !== "string") return DEFAULT_BASE_PATH;
  if (normalizeBasePath(basePath) === "") return "";
  return canonicalBasePath(basePath) || DEFAULT_BASE_PATH;
}

/** Mirror of flame's `resolveDeployPath`: the path part of `meta.baseURL`. */
export function resolveDeployPath(config: DocuConfig): string {
  const raw = config.meta?.baseURL;
  if (typeof raw !== "string") return "";
  try {
    return normalizeBasePath(new URL(raw).pathname);
  } catch {
    return raw.startsWith("/") ? normalizeBasePath(raw) : "";
  }
}

function domainOf(baseURL: string): string | undefined {
  try {
    const url = new URL(baseURL);
    return `${url.host}${trimSlashes(url.pathname, true)}`;
  } catch {
    return undefined;
  }
}

export function resolveSite(config: DocuConfig, options: ResolvedOptions, root: string): Site {
  const prefix = resolveBasePath(config);
  const ownPages = config.experimental?.pages === true;
  const baseURL = trimSlashes((config.meta?.baseURL ?? "").trim(), true);
  const navbarName = config.navbar?.logoText?.trim();
  return {
    root,
    docsDir: join(root, "docs"),
    prefix,
    baseURL,
    domain: baseURL ? domainOf(baseURL) : undefined,
    siteName: options.siteName ?? (navbarName || config.meta?.title?.trim() || "Docs"),
    hasLanding: !ownPages,
    // At the deployment root without own pages the landing page owns `/`, so
    // flame skips the docs index (see build.ts `docsIndexWritable`).
    hasDocsIndex: prefix !== "" || ownPages,
    routes: Array.isArray(config.routes) ? config.routes : [],
  };
}

/**
 * Title of the top-level sidebar group a docs page sits in, e.g. "Getting
 * Started" for `getting-started/configuration`. Top-level pages have none.
 */
export function sectionFor(routes: Site["routes"], slug: string): string | undefined {
  const segments = slug.split("/");
  if (segments.length < 2) return undefined;
  const route = routes.find(
    (r) => typeof r.href === "string" && trimSlashes(r.href) === segments[0]
  );
  const title = route?.title?.trim();
  return title || undefined;
}

/** Absolute directory flame writes the docs pages to. */
export function docsOutputDir(outDir: string, prefix: string): string {
  return prefix === "" ? outDir : join(outDir, prefix.slice(1));
}

/**
 * Absolute URL of a card, as flame's SEO resolver builds it for a relative
 * `frontmatter.image`. Root-relative when `meta.baseURL` is unset.
 */
export function cardUrl(site: Site, file: string): string {
  return `${site.baseURL}${site.prefix}/${CARD_DIR}/${file}`;
}

/** True when `file` is inside `root` (or is `root`). */
export function isInside(root: string, file: string): boolean {
  const rel = relative(root, file);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

export const LOGO_TYPES: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

export type LogoLookup =
  { file: string } | { reason: "remote" | "outside" | "missing" | "type"; value: string };

/**
 * Map a logo reference to a file in the project.
 *
 * `navbar.logo.src` is a site path (`/docs/assets/images/logo.svg`), while the
 * `logo` option may also be a project path (`brand/logo.svg`). Site paths
 * under the docs prefix, or under the default `/docs` spelling flame re-bases,
 * map to `docs/`; anything else is tried relative to the project root, then
 * to `docs/`.
 */
export function findLogoFile(value: string, site: Site, deployPath: string): LogoLookup {
  if (isRemoteReference(value)) return { reason: "remote", value };
  let path = value.split(/[?#]/)[0];
  const candidates: string[] = [];
  if (path.startsWith("/")) {
    if (deployPath && path.startsWith(`${deployPath}/`)) path = path.slice(deployPath.length);
    for (const prefix of [site.prefix, DEFAULT_BASE_PATH]) {
      if (prefix && path.startsWith(`${prefix}/`)) {
        candidates.push(join(site.docsDir, path.slice(prefix.length + 1)));
      }
    }
    if (site.prefix === "") candidates.push(join(site.docsDir, path.slice(1)));
    candidates.push(join(site.root, path.slice(1)));
  } else {
    candidates.push(resolve(site.root, path), resolve(site.docsDir, path));
  }

  let outside = false;
  for (const candidate of candidates) {
    if (!isInside(site.root, candidate)) {
      outside = true;
      continue;
    }
    try {
      if (statSync(candidate).isFile()) {
        if (!(extname(candidate).toLowerCase() in LOGO_TYPES)) return { reason: "type", value };
        return { file: candidate };
      }
    } catch {
      // not there, try the next candidate
    }
  }
  return { reason: outside ? "outside" : "missing", value };
}
