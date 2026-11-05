import { resolve, join } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { readdir, rm, unlink } from "node:fs/promises";
import type { DocuConfig } from "./types";
import { resolveBasePath, resolveDeployPath, validateBasePath } from "./base-path";
import type { BasePathIssue } from "./base-path";
import {
  resolveOwnPages,
  validateOwnPages,
  resolveBundlePath,
  resolveNotFoundPath,
  needsStandaloneRoot,
  STANDALONE_ENV,
} from "./experimental";

export {
  DEFAULT_BASE_PATH,
  normalizeBasePath,
  canonicalBasePath,
  resolveBasePath,
  resolveDeployPath,
  docsDepth,
  validateBasePath,
} from "./base-path";
export type { BasePathIssue } from "./base-path";
export {
  resolveOwnPages,
  resolveRootRoute,
  validateOwnPages,
  resolveBundlePath,
  resolveNotFoundPath,
  needsStandaloneRoot,
  redirectHtml,
  STANDALONE_ENV,
  OWN_PAGES_BUNDLE_DIR,
} from "./experimental";
export type { RootRoute } from "./experimental";

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
// ASSETS_DIR (the bundle tree) depends on `docu.json` and is declared at the
// end of this module, next to DOCS_OUT_DIR.
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

/** Default favicon — resolves against the runtime `meta.basePath`. Lives here
 *  (not in `./base-path`) because it needs the config-loaded `basePath()`. */
export function defaultFavicon(): string {
  return `${basePath()}/assets/images/favicon.ico`;
}

/**
 * @deprecated Read the value at call time via {@link defaultFavicon} — this
 * constant is frozen at import and cannot follow `meta.basePath`.
 */
export const DEFAULT_FAVICON = "/docs/assets/images/favicon.ico";

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
 * Deployment-root path contributed by the host — `""` when the origin serves
 * the dist at `/`, `/repo` for a GitHub Pages project site. Root-absolute
 * references (404 fallback assets, the search index) are built from it.
 */
export function deployPath(): string {
  let config: DocuConfig | null = null;
  try {
    config = loadDocuConfig();
  } catch {
    // config absent/unreadable (tests, ad-hoc scripts) — assume an origin root
  }
  return resolveDeployPath(config);
}

/**
 * {@link deployPath} for the current mode: a host path only exists in built
 * output. Dev serves the project from the origin root, so writing it into dev
 * HTML (or a dev client bundle) would point at directories the dev server does
 * not own.
 */
export function servedDeployPath(): string {
  return process.env.NODE_ENV === "production" ? deployPath() : "";
}

/**
 * Fail fast on a `meta.basePath` that cannot be honored (a non-string value) and
 * hand back the normalization warnings for the caller to log — case, whitespace
 * and unservable characters are normalized by `resolveBasePath`, not rejected.
 * Called from the build and dev-server entries so the message lands before any
 * output is written.
 */
export function assertValidBasePath(): BasePathIssue[] {
  let config: DocuConfig | null = null;
  try {
    config = loadDocuConfig();
  } catch {
    return [];
  }

  const issues = validateBasePath(config?.meta?.basePath);
  const errors = issues.filter((issue) => issue.level === "error");
  if (errors.length > 0) {
    throw new Error(
      [
        `Invalid "meta.basePath" in ${DOCU_CONFIG_PATH}:`,
        ...errors.map((issue) => `  • ${issue.message}`),
      ].join("\n")
    );
  }
  return issues.filter((issue) => issue.level === "warning");
}

/**
 * Whether the project brings its own pages (`experimental.pages`). Read at
 * call time, like {@link basePath}: a missing or unreadable config means the
 * default, which is the generated landing page and 404.
 */
export function ownPages(): boolean {
  let config: DocuConfig | null = null;
  try {
    config = loadDocuConfig();
  } catch {
    // config absent/unreadable (tests, ad-hoc scripts) — use the default
  }
  return resolveOwnPages(config);
}

/**
 * Fail fast on an `experimental` section that cannot be honored (a non-boolean
 * `pages`) and hand back the warnings for the caller to log. Mirrors
 * {@link assertValidBasePath}: called from the build and dev-server entries so
 * the message lands before any output is written.
 */
export function assertValidExperimental(): BasePathIssue[] {
  let config: DocuConfig | null = null;
  try {
    config = loadDocuConfig();
  } catch {
    return [];
  }

  const issues = validateOwnPages(config);
  const errors = issues.filter((issue) => issue.level === "error");
  if (errors.length > 0) {
    throw new Error(
      [
        `Invalid "experimental" in ${DOCU_CONFIG_PATH}:`,
        ...errors.map((issue) => `  • ${issue.message}`),
      ].join("\n")
    );
  }
  return issues.filter((issue) => issue.level === "warning");
}

/**
 * Build-output directory for docs pages — derived from `meta.basePath`.
 * Declared after the resolver above: `const` bindings initialize in order, and
 * `DOCS_OUT_DIR` reads `DEFAULT_BASE_PATH` through the chain.
 */
export const DOCS_OUT_DIR = docsOutDir(DIST_DIR);

/**
 * URL path (from the dist root, no trailing slash) of the hashed bundles, the
 * asset manifest and the search index: `/assets` by default, `<basePath>/_flame`
 * under `experimental.pages`. Same value in dev and in the build.
 */
export function bundlePath(): string {
  return resolveBundlePath(ownPages(), basePath());
}

/** URL path (from the dist root) of the generated 404 page. */
export function notFoundPath(): string {
  return resolveNotFoundPath(ownPages(), basePath());
}

/**
 * Whether this build should also write the standalone root entry points (a
 * redirecting `index.html` and a root `404.html`). Requested by deploy flows
 * that publish the dist on its own — see {@link STANDALONE_ENV}.
 */
export function standaloneRoot(): boolean {
  return process.env[STANDALONE_ENV] === "1" && needsStandaloneRoot(ownPages(), basePath());
}

/**
 * Bundle output directory — derived from {@link bundlePath}. Declared last for
 * the same reason as `DOCS_OUT_DIR`: it reads the config singleton, whose
 * `let` binding must be initialized first.
 */
export const ASSETS_DIR = join(DIST_DIR, bundlePath().slice(1));

/**
 * Remove bundles a default build left at the dist root, once the project
 * brings its own pages and the bundle tree has moved under the docs prefix.
 */
export async function cleanRootBundles(): Promise<void> {
  await cleanRootBundlesIn(DIST_DIR, ASSETS_DIR, DOCS_OUT_DIR);
}

/**
 * {@link cleanRootBundles} over explicit directories, so it can be tested.
 *
 * `<dist>/assets/` goes entirely only when it holds nothing but Flame's old
 * bundles. It is also where `docs/assets` is copied at a root deployment, and
 * it *is* the docs output when `meta.basePath` sits under `/assets` — so when
 * the docs output is that directory or lives inside it, only files with
 * Flame's own hashed names are removed. The docs pages are written before
 * this runs, so a recursive delete there would ship an empty site.
 */
export async function cleanRootBundlesIn(
  distDir: string,
  assetsDir: string,
  docsOutDir: string
): Promise<void> {
  const rootAssets = join(distDir, "assets");
  if (rootAssets === assetsDir) return;
  const docsInRootAssets =
    docsOutDir === distDir || docsOutDir === rootAssets || docsOutDir.startsWith(rootAssets + "/");
  if (!docsInRootAssets) {
    await rm(rootAssets, { recursive: true, force: true });
    return;
  }
  for (const fixed of ["manifest.json", "search-index.json", "chunks"]) {
    await rm(join(rootAssets, fixed), { recursive: true, force: true });
  }
  let files: string[];
  try {
    files = await readdir(rootAssets);
  } catch {
    return;
  }
  for (const file of files) {
    if (
      /^(client|home-client)-[A-Za-z0-9_-]{8}\.js(\.map)?$/.test(file) ||
      /^(docs|site)-[0-9a-f]{16}\.css$/.test(file)
    ) {
      await rm(join(rootAssets, file), { force: true });
    }
  }
}
