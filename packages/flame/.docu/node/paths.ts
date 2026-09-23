import { resolve, join } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { readdir, rm, unlink } from "node:fs/promises";
import type { DocuConfig } from "./types";

/**
 * FRAMEWORK_ROOT: Where the package code lives (.docu/components, .docu/pages, .docu/styles, .docu/node)
 * PROJECT_ROOT: Where the user's project lives (docs/, docu.json)
 */

// .docu/node/paths.ts → package root is 2 levels up
export const FRAMEWORK_ROOT = resolve(import.meta.dirname, "../..");

/**
 * Find the project root by walking up from cwd until docu.json is found.
 * Falls back to cwd when not found (tests, ad-hoc scripts). Bun 1.4
 * `run --parallel --filter` may change cwd per workspace task, so a bare
 * process.cwd() can point at the wrong package.
 */
function findProjectRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    try {
      if (existsSync(join(dir, "docu.json"))) return dir;
    } catch {
      break;
    }
    const parent = resolve(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}
export const PROJECT_ROOT = findProjectRoot();

// Framework paths (internal)
export const PAGES_DIR = join(FRAMEWORK_ROOT, ".docu/pages");
export const STYLES_DIR = join(FRAMEWORK_ROOT, ".docu/styles");
const nodeDir = join(FRAMEWORK_ROOT, ".docu/node");
const libDir = join(FRAMEWORK_ROOT, ".docu/lib");
export const LIB_DIR = existsSync(nodeDir) ? nodeDir : libDir;

// Build output (user project)
export const DIST_DIR = join(PROJECT_ROOT, ".docu/dist");
export const ASSETS_DIR = join(DIST_DIR, "assets");
export const CACHE_FILE = join(PROJECT_ROOT, ".docu/build-cache.json");

// Project paths (user content)
export const DOCS_DIR = join(PROJECT_ROOT, "docs");
export const DOCS_ASSETS_DIR = join(PROJECT_ROOT, "docs/assets");
export const DOCU_CONFIG_PATH = join(PROJECT_ROOT, "docu.json");

/** Resolve a project-relative file against the discovered PROJECT_ROOT. */
export function resolveProjectFile(...segments: string[]): string {
  return join(PROJECT_ROOT, ...segments);
}

// Config singleton
let _config: DocuConfig | null = null;

/** Clean stale client bundles from a previous build. */
export async function cleanOldBundles(preserve?: Set<string>) {
  try {
    const files = await readdir(ASSETS_DIR);
    for (const file of files) {
      if (preserve?.has(file)) continue;
      if (/^(client|home-client|docs|site)[.-]/.test(file)) {
        await unlink(join(ASSETS_DIR, file));
      }
    }
    await rm(join(ASSETS_DIR, "chunks"), { recursive: true, force: true });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error("Failed to clean old bundles:", (err as Error).message);
    }
  }
}

export function loadDocuConfig(): DocuConfig {
  if (_config) return _config;
  if (!existsSync(DOCU_CONFIG_PATH)) {
    throw new Error(`docu.json not found at ${DOCU_CONFIG_PATH}`);
  }
  _config = JSON.parse(readFileSync(DOCU_CONFIG_PATH, "utf-8"));
  return _config!;
}

/**
 * Default URL prefix the docs site is served under. Kept as `/docs` so
 * existing deployments keep byte-identical output.
 */
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

/**
 * Cached base path for the current project. Callers that already hold a config
 * may pass it in; otherwise the config singleton is loaded on first use.
 *
 * Safe to read eagerly at module scope even though `loadDocuConfig()` is only
 * invoked inside a build: `PROJECT_ROOT` is resolved at import time, and the
 * fallback (missing or malformed docu.json) is the `/docs` default, so the
 * value never depends on call order.
 */
export function basePath(): string {
  let config: DocuConfig | null = null;
  try {
    config = loadDocuConfig();
  } catch {
    // config absent/unreadable (tests, ad-hoc scripts) — use the default
  }
  return resolveBasePath(config);
}

/** Build-output directory for docs pages, e.g. `.docu/dist/docs` or `dist/` at the root. */
export function docsOutDir(distDir: string, resolvedBasePath: string = basePath()): string {
  return resolvedBasePath.length === 0 ? distDir : join(distDir, resolvedBasePath.slice(1));
}

/** Serve-prefix counterpart of {@link docsOutDir}: `""` at the root, else
 * `/prefix` with no trailing slash. */
export function servedBasePath(resolvedBasePath: string = basePath()): string {
  return resolvedBasePath;
}

/**
 * Build-output directory for docs pages — derived from `meta.basePath`.
 * Declared after the resolver above: `const` bindings initialize in order, and
 * `DOCS_OUT_DIR` reads `DEFAULT_BASE_PATH` through the chain.
 */
export const DOCS_OUT_DIR = docsOutDir(DIST_DIR);
