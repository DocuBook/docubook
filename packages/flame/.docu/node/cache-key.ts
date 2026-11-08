import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import { rm } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  FRAMEWORK_ROOT,
  STYLES_DIR,
  resolveProjectFile,
  basePath,
  deployPath,
  ownPages,
  loadDocuConfig,
  PROJECT_ROOT,
} from "./paths";
import { packageFingerprint, resolvePackages, type WorkspacePackage } from "./dev-watch";
import type { PluginEntry } from "./plugin";

/**
 * Build cache version — bump when the toolchain output contract changes
 * (e.g. Bun.build barrel optimization, Tailwind CLI upgrade). Old caches
 * with a mismatched version are discarded on read (see build.ts readCache).
 *
 * v6: pages became base-path aware (`meta.basePath`), and the resolved value
 * is folded into `basePathStamp()` below. Bumping here also invalidates any
 * cache written by an earlier config, so a base-path edit can never be
 * silently skipped as "unchanged".
 *
 * v7: stylesheet fingerprints entered the key material — the bundle hash folds
 * `cssBundleStamp()`, and the stylesheet key hashes the entry's whole import
 * graph (plain CSS plus package stylesheets), so a CSS-only edit invalidates
 * the assets it changes instead of waiting for `--force`.
 *
 * v8: the built `@docubook/*` packages entered the key material —
 * `renderToolchainStamp()` folds `packagesStamp()`, so upgrading or
 * rebuilding a sibling package invalidates the pages and the client bundle
 * rendered with it.
 *
 * v9: `docu.json` entered the key material (`configStamp()`). The sidebar,
 * navbar, repo links and SEO tags are rendered from it, and the client bundle
 * inlines it, yet a config-only edit used to leave every page a cache hit and
 * reuse the old bundle until `--force`.
 *
 * v10: the `docu.json` plugins entered the key material — `renderToolchainStamp()`
 * folds `pluginsStamp()`, so pages are no longer re-rendered on every build
 * just because a plugin is configured.
 */
export const BUILD_CACHE_VERSION = 10;

/**
 * Resolved docs URL prefix and deployment path, part of every cache key.
 *
 * The page cache is keyed by relative MDX path and the bundle/asset slots are
 * hashed from MDX source alone — neither changes when only `meta.basePath` or
 * `meta.baseURL`'s path changes. Without this stamp, editing either would leave
 * every key untouched and the build would skip every page, emitting HTML that
 * still points at the old prefix.
 */
export function basePathStamp(): string {
  return prefixStamp(basePath(), deployPath()) + ownPagesStamp(ownPages());
}

/**
 * `experimental.pages` shares the key material: flipping it changes what the
 * bundle contains (no landing entry) and, at the deployment root, whether the
 * docs index is written at all — neither of which an MDX hash can see.
 */
export function ownPagesStamp(enabled: boolean): string {
  return enabled ? "+pages" : "";
}

/**
 * Compose the cache stamp from both prefixes that shape generated URLs: the
 * docs prefix and the host's deployment path (from `meta.baseURL`). Either one
 * changing has to invalidate the cache, or a warm cache keeps serving HTML that
 * points at the old location.
 */
export function prefixStamp(resolvedBasePath: string, deploymentPath: string): string {
  if (deploymentPath.length === 0) return resolvedBasePath;
  return `${resolvedBasePath || "/"}@${deploymentPath}`;
}

/**
 * Toolchain fingerprint: Bun version on Bun, Deno version on Deno, Node elsewhere.
 */
export function runtimeStamp(): string {
  const g = globalThis as Record<string, unknown>;
  const bun = g.Bun as { version?: string } | undefined;
  if (typeof bun?.version === "string" && bun.version.length > 0) return `bun-${bun.version}`;
  const deno = g.Deno as { version?: { deno?: string } } | undefined;
  if (typeof deno?.version?.deno === "string" && deno.version.deno.length > 0)
    return `deno-${deno.version.deno}`;
  const proc = g.process as { version?: string } | undefined;
  if (typeof proc?.version === "string" && proc.version.length > 0) return `node-${proc.version}`;
  return "node-unknown";
}

/**
 * Framework source files that shape rendered HTML.
 *
 * Page cache entries are keyed by MDX source alone, so editing the renderer
 * (a template tweak, a new meta tag, base-path plumbing) would otherwise leave
 * every page a cache hit and keep serving HTML built by the old code. Hashing
 * these sources makes a framework edit invalidate the pages it affects.
 */
export const RENDER_SOURCE_FILES = [
  ".docu/node/html.ts",
  ".docu/node/html.shared.ts",
  ".docu/node/seo.ts",
  ".docu/node/utils.ts",
  ".docu/node/paths.ts",
  ".docu/node/base-path.ts",
  ".docu/node/experimental.ts",
  ".docu/node/mdx.ts",
  ".docu/node/search-indexer.ts",
  ".docu/node/build.ts",
  ".docu/node/build.impl.ts",
  ".docu/node/server-routes.ts",
  ".docu/components/DocsLayout.tsx",
  ".docu/components/Navbar.tsx",
  ".docu/pages/index.tsx",
  ".docu/pages/404.tsx",
  ".docu/pages/docs/[[...slug]].tsx",
] as const;

/**
 * Fingerprint of the built `@docubook/*` packages flame renders with.
 *
 * Pages are server-rendered and the client bundle is compiled from these
 * packages' `dist/`, yet neither cache key sees them: upgrading
 * `@docubook/markdown`, or rebuilding it in this monorepo without a version
 * bump, kept serving pages and a bundle built from the old code. Hashing the
 * built output covers both, and an installed copy hashes the same for as long
 * as its version stays put. A package that does not resolve contributes
 * nothing; one whose entry is missing (mid-rebuild) is recorded as such.
 */
export function packagesStamp(packages: readonly WorkspacePackage[] = resolvePackages()): string {
  const h = createHash("sha256");
  for (const pkg of packages) {
    h.update(`${pkg.name}\0${packageFingerprint(pkg) ?? "missing"}\0`);
  }
  return h.digest("hex").slice(0, 16);
}

/**
 * Fingerprint of the plugins listed in `docu.json`.
 *
 * Plugin hooks shape every page (onLoad, remark/rehype, injectHead/Body,
 * transformHtml), but `configStamp()` only sees their specifiers and options:
 * upgrading a plugin package, or editing a local plugin file, changed output
 * without changing any key. A package hashes as its version plus its built
 * `dist/`, a local file as its content, anything unresolvable as "missing".
 *
 * Local paths resolve from `root`, as `loadPlugins` does. Packages are looked
 * up from `packagesFrom`, the directory `plugin-loader` imports them from (it
 * sits next to this module in both `.docu/node` and the compiled `.docu/lib`).
 */
export function pluginsStamp(
  entries: readonly PluginEntry[] = readPluginEntries(),
  root: string = PROJECT_ROOT,
  packagesFrom: string = dirname(fileURLToPath(import.meta.url))
): string {
  const h = createHash("sha256");
  for (const entry of entries) {
    const specifier = Array.isArray(entry) ? entry[0] : entry;
    h.update(`${specifier}\0${pluginFingerprint(specifier, root, packagesFrom)}\0`);
  }
  return h.digest("hex").slice(0, 16);
}

const LOCAL_PLUGIN_SUFFIXES = [
  "",
  ".ts",
  ".tsx",
  ".mts",
  ".js",
  ".mjs",
  ".cjs",
  "/index.ts",
  "/index.js",
  "/index.mjs",
] as const;

function pluginFingerprint(specifier: string, root: string, packagesFrom: string): string {
  try {
    if (specifier.startsWith(".") || specifier.startsWith("/")) {
      // The loader imports extensionless paths (`./plugins/reading-time`), so
      // find the file the runtime would load instead of reading the bare path.
      const base = resolve(root, specifier);
      const file = LOCAL_PLUGIN_SUFFIXES.map((suffix) => base + suffix).find(
        (p) => existsSync(p) && statSync(p).isFile()
      );
      if (!file) return "missing";
      // shortcut: hashes the plugin's own file only, not the files it imports; edit one of those and run `flame build --force`.
      return createHash("sha256").update(readFileSync(file)).digest("hex");
    }
    const dir = findInstalledPackage(specifier, packagesFrom);
    if (!dir) return "missing";
    const manifest = join(dir, "package.json");
    const { version } = JSON.parse(readFileSync(manifest, "utf-8")) as { version?: string };
    // The manifest stands in for the entry: which file `import()` loads depends
    // on the package's `exports` conditions, and only `dist/` is hashed anyway.
    const pkg = { name: specifier, dir, entry: manifest };
    return `${version ?? ""}\0${packageFingerprint(pkg) ?? "missing"}`;
  } catch {
    return "missing";
  }
}

/**
 * The `node_modules/<name>` directory `import(name)` would load from `fromDir`,
 * found by walking up like the runtime does. Unlike `require.resolve`, this
 * does not depend on the package's `exports` conditions, so ESM-only plugins
 * (`"exports": { ".": { "import": … } }`) resolve too.
 */
function findInstalledPackage(name: string, fromDir: string): string | null {
  for (let dir = fromDir; ; dir = dirname(dir)) {
    const candidate = join(dir, "node_modules", ...name.split("/"));
    if (existsSync(join(candidate, "package.json"))) return realpathSync(candidate);
    if (dirname(dir) === dir) return null;
  }
}

function readPluginEntries(): readonly PluginEntry[] {
  return (readConfigForStamp() as { plugins?: PluginEntry[] } | null)?.plugins ?? [];
}

let renderStampCache: string | null = null;

/**
 * Fingerprint of the framework's rendering sources, the sibling packages
 * they render with (`packagesStamp()`) and the configured plugins
 * (`pluginsStamp()`).
 *
 * Memoized per process — the files cannot change mid-build, and hashing them
 * on every page would dominate build time. A missing file contributes nothing
 * so a partial install still yields a stable (if weaker) stamp.
 */
export function renderToolchainStamp(): string {
  if (renderStampCache !== null) return renderStampCache;
  const h = createHash("sha256");
  h.update(`v${BUILD_CACHE_VERSION}`);
  for (const rel of RENDER_SOURCE_FILES) {
    const file = join(FRAMEWORK_ROOT, rel);
    try {
      if (!existsSync(file)) continue;
      h.update(rel).update("\0").update(readFileSync(file, "utf-8"));
    } catch {
      // unreadable source — skip it rather than break the build
    }
  }
  h.update("packages\0").update(packagesStamp());
  h.update("plugins\0").update(pluginsStamp());
  renderStampCache = h.digest("hex").slice(0, 16);
  return renderStampCache;
}

/**
 * True when a CSS file can change Tailwind v4 output.
 * v4 is CSS-first: `@theme`, `@source`, `@plugin`, `@custom-variant`,
 * `@utility`, `@config`, `@apply`/`@variant`, and `@import "tailwindcss"`
 * all live in CSS. Plain CSS without these cannot affect the CLI output,
 * so it is excluded to avoid false cache busts. Broad match deliberate:
 * false positive busts safe, false negative serves stale CSS.
 */
export function isTailwindRelevantCss(content: string): boolean {
  return (
    content.includes("@theme") ||
    content.includes("@source") ||
    content.includes("@plugin") ||
    content.includes("@custom-variant") ||
    content.includes("@utility") ||
    content.includes("@config") ||
    content.includes("@apply") ||
    content.includes("@variant") ||
    content.includes("@layer") ||
    content.includes("tailwindcss")
  );
}

const IMPORT_RE = /@import\s+(?:url\()?["']([^"']+)["']/g;
const MAX_IMPORT_DEPTH = 10;

/** Resolve `./` + `../` imports (bare specifiers go through the package resolver). */
function resolveRelativeImport(spec: string, fromDir: string): string | undefined {
  if (!spec.startsWith(".")) return undefined;
  const clean = spec.split("?")[0]!.split("#")[0]!;
  if (clean.length === 0) return undefined;
  return join(fromDir, clean);
}

/**
 * Resolve a bare specifier (`@docubook/markdown/styles.css`) to the file it
 * names in `node_modules`.
 *
 * A package stylesheet imported by the entry is emitted verbatim, so its
 * content belongs in the cache key — otherwise editing the package's CSS keeps
 * serving the previous bundle. The lookup walks up from the file that wrote the
 * `@import`, checking `node_modules` at each level (Node's own order), which
 * covers both the flat layout and pnpm's virtual store, where a package sits at
 * `.../.pnpm/@docubook+flame@1/node_modules/@docubook/flame` and its deps
 * resolve from the store directory above it. Directory targets such as
 * `@import "tailwindcss"` are not files and resolve to undefined, so the
 * vendored Tailwind tree never enters the key.
 */
function resolvePackageImport(spec: string, fromDir: string, root: string): string | undefined {
  if (spec.startsWith(".")) return undefined;
  const clean = spec.split("?")[0]!.split("#")[0]!;
  if (clean.length === 0) return undefined;

  const isFile = (candidate: string): boolean => {
    try {
      return existsSync(candidate) && statSync(candidate).isFile();
    } catch {
      return false;
    }
  };

  const bases: string[] = [];
  let dir = fromDir;
  for (let depth = 0; depth < 12; depth++) {
    bases.push(dir);
    const parent = join(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  bases.push(root, FRAMEWORK_ROOT);

  for (const base of bases) {
    const candidate = join(base, "node_modules", clean);
    if (isFile(candidate)) return candidate;
  }
  return undefined;
}

interface CssReadOptions {
  /** Root used to resolve bare package imports under `node_modules`. */
  root: string;
  /**
   * Keep plain CSS as well as v4 directives. True for the entry stylesheet and
   * everything it imports: Tailwind copies those rules into the output as-is,
   * so any edit there changes the emitted bundle. False for project CSS the
   * entry never imports, where only v4 directives can matter.
   */
  keepPlain: boolean;
}

/**
 * Read a CSS file plus transitively imported files.
 * Filtered files contribute "" themselves, but their imports are still
 * followed (nested file may carry `@theme`). `visited` breaks import cycles.
 * Missing/unreadable files resolve to "" — never throws.
 */
function readCssWithImports(
  path: string,
  visited: Set<string>,
  opts: CssReadOptions,
  depth = 0
): string {
  if (depth > MAX_IMPORT_DEPTH || visited.has(path)) return "";
  visited.add(path);
  let content = "";
  try {
    if (!existsSync(path)) return "";
    content = readFileSync(path, "utf-8");
  } catch {
    return "";
  }
  let out = opts.keepPlain || isTailwindRelevantCss(content) ? content : "";
  try {
    const dir = join(path, "..");
    for (const m of content.matchAll(IMPORT_RE)) {
      const spec = m[1] ?? "";
      const resolved =
        resolveRelativeImport(spec, dir) ?? resolvePackageImport(spec, dir, opts.root);
      if (resolved) out += readCssWithImports(resolved, visited, opts, depth + 1);
    }
  } catch {
    // import scan failed — keep what we have
  }
  return out;
}

function scanCssDir(dir: string, visited: Set<string>, opts: CssReadOptions): string {
  let out = "";
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === "assets" || e.name.startsWith(".") || e.name === "node_modules") continue;
        out += scanCssDir(full, visited, opts);
      } else if (e.name.endsWith(".css")) {
        out += readCssWithImports(full, visited, opts);
      }
    }
  } catch {
    // docs/ missing — nothing to add
  }
  return out;
}

function scanRootCss(root: string, visited: Set<string>, opts: CssReadOptions): string {
  let out = "";
  try {
    const entries = readdirSync(root, { withFileTypes: true });
    for (const e of entries) {
      if (e.isFile() && e.name.endsWith(".css")) {
        out += readCssWithImports(join(root, e.name), visited, opts);
      }
    }
  } catch {
    // unreadable root — proceed without
  }
  return out;
}

/** Hash @theme/@source/@plugin-bearing CSS in project docs/ + root *.css. */
function tailwindCssThemeInputs(root: string): string {
  const visited = new Set<string>();
  const opts: CssReadOptions = { root, keepPlain: false };
  return scanCssDir(join(root, "docs"), visited, opts) + scanRootCss(root, visited, opts);
}

const TAILWIND_CONFIG_FILES = [
  "tailwind.config.ts",
  "tailwind.config.js",
  "tailwind.config.mjs",
  "tailwind.config.cjs",
  "tailwind.config.mts",
  "tailwind.config.cts",
  "postcss.config.js",
  "postcss.config.mjs",
  "postcss.config.cjs",
];

/**
 * JS config still affects v4 when referenced via `@config`
 * (plus PostCSS pipeline config). Content hashed when present.
 */
function tailwindJsConfigInputs(root: string): string {
  let out = "";
  for (const name of TAILWIND_CONFIG_FILES) {
    try {
      const p = join(root, name);
      if (existsSync(p)) out += readFileSync(p, "utf-8") + "\0";
    } catch {
      // unreadable config — skip
    }
  }
  return out;
}

function readInstalledVersion(pkg: string, roots: string[]): string {
  for (const root of roots) {
    try {
      const p = join(root, "node_modules", ...pkg.split("/"), "package.json");
      if (existsSync(p)) {
        const parsed = JSON.parse(readFileSync(p, "utf-8")) as { version?: string };
        if (typeof parsed.version === "string" && parsed.version.length > 0) return parsed.version;
      }
    } catch {
      // try next root
    }
  }
  return "";
}

/** Pin resolved CSS-affecting deps into the key (installed version wins). */
function tailwindVersionPins(root: string): string {
  const names = ["tailwindcss", "@tailwindcss/cli", "@tailwindcss/typography", "daisyui"] as const;
  let extra = "";
  const roots = [root, FRAMEWORK_ROOT];
  for (const name of names) {
    const installed = readInstalledVersion(name, roots);
    if (installed) extra += `${name}@${installed}\0`;
  }
  try {
    const pkgPath = join(root, "package.json");
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      for (const name of names) {
        const range = pkg.dependencies?.[name] ?? pkg.devDependencies?.[name] ?? "";
        if (range) extra += `${name}:${range}\0`;
      }
    }
  } catch {
    // package.json unreadable — proceed without version pin
  }
  return extra;
}

/**
 * Extra Tailwind inputs beyond globals.css + theme.
 * v4 is CSS-first: user overrides live in `@theme`/`@source`/`@plugin`
 * blocks inside CSS files under the project root (e.g. docs slash star dot css),
 * plus JS config referenced via `@config` and installed plugin versions.
 * Missing files resolve to "" — never throws.
 */
export function tailwindExtraInputs(root: string = resolveProjectFile()): string {
  return (
    tailwindCssThemeInputs(root) + "\0" + tailwindJsConfigInputs(root) + tailwindVersionPins(root)
  );
}

/**
 * Shared Tailwind cache key: globals.css + theme + tailwind config +
 * toolchain version. Used by both hydrate.ts (Bun) and hydrate.node.ts
 * (Vite) so the two runtimes agree on filenames. Segments joined with NUL
 * so `("ab","c")` and `("a","bc")` hash differently.
 */
export function computeTailwindCacheKey(
  globals: string,
  themeSuffix: string,
  projectRoot: string = resolveProjectFile()
): string {
  const h = createHash("sha256");
  h.update(globals);
  h.update("\0");
  h.update(themeSuffix);
  h.update("\0");
  h.update(tailwindExtraInputs(projectRoot));
  h.update("\0");
  h.update(runtimeStamp());
  h.update("\0");
  h.update(basePathStamp());
  h.update("\0");
  h.update(`v${BUILD_CACHE_VERSION}`);
  return h.digest("hex").slice(0, 16);
}

/**
 * Read a Tailwind entry plus everything it imports for cache invalidation.
 *
 * `keepPlain`: the entry graph is hashed verbatim (Tailwind copies its plain
 * rules into the output), and bare package imports are followed into
 * `node_modules` — a stylesheet shipped by a dependency, e.g.
 * `@docubook/markdown/styles.css`, changes the bundle like any other input.
 * `dir`/`root` are overridable for tests.
 */
export function readStyleCss(
  file = "globals.css",
  dir: string = STYLES_DIR,
  root: string = resolveProjectFile()
): string {
  return readCssWithImports(join(dir, file), new Set(), { root, keepPlain: true });
}

/** Backward-compatible alias for the docs stylesheet entry. */
export function readGlobalsCss(): string {
  return readStyleCss();
}

/**
 * Atomic file write: tmp + rename so a crash mid-write never leaves a
 * half-written cache/CSS behind. Tmp name includes pid so parallel
 * builds (`bun run --parallel`) do not clobber each other.
 */
export async function atomicWriteFile(
  writeFile: (p: string, data: string | Uint8Array) => Promise<void>,
  rename: (from: string, to: string) => Promise<void>,
  unlink: (p: string) => Promise<void>,
  target: string,
  data: string | Uint8Array
): Promise<void> {
  const g = globalThis as Record<string, unknown>;
  const proc = g.process as { pid?: number } | undefined;
  const pid = typeof proc?.pid === "number" ? proc.pid : Math.floor(Math.random() * 1e9);
  const tmp = `${target}.tmp-${pid}-${Date.now()}`;
  try {
    await writeFile(tmp, data);
    await rename(tmp, target);
  } catch (err) {
    try {
      await unlink(tmp);
    } catch {
      // best-effort tmp cleanup
    }
    throw err;
  }
}

/** Wire memory-pressure hook once: OS low-memory → drop parsed page maps. */
let memoryPressureHooked = false;
export function hookMemoryPressure(clear: () => void): void {
  if (memoryPressureHooked) return;
  memoryPressureHooked = true;
  try {
    const g = globalThis as Record<string, unknown>;
    const proc = g.process as
      | {
          on?: (event: string, listener: (level: string) => void) => void;
        }
      | undefined;
    proc?.on?.("memoryPressure", () => {
      try {
        clear();
      } catch {
        // never throw out of a pressure handler
      }
    });
  } catch {
    // runtimes without the event (Node < Bun 1.4 backport) — no-op
  }
}

/**
 * Whether the `manifest.json` found on disk is the one the last build wrote:
 * `__assets__.hash` starts with that build's manifest JSON. Anything else —
 * a dev-server manifest, a hand edit — must not be adopted on a bundle cache
 * hit, or every page keeps pointing at a bundle that no longer exists.
 */
export function manifestMatchesCache(manifestJson: string, cachedAssetsHash: unknown): boolean {
  return typeof cachedAssetsHash === "string" && cachedAssetsHash.startsWith(manifestJson + "\0");
}

/**
 * Hash of compiled MDX module sources (sorted keys + content).
 * Used to skip the JS bundle rebuild when no page content changed.
 *
 * `extraStamp` folds inputs the MDX sources cannot see — the stylesheet
 * fingerprint (`cssBundleStamp()`) — so a CSS-only edit still rebuilds assets.
 */
export function hashMdxSources(mdxSources: Record<string, string>, extraStamp = ""): string {
  const h = createHash("sha256");
  const slugs = Object.keys(mdxSources).sort();
  h.update(
    `v${BUILD_CACHE_VERSION}:${runtimeStamp()}:${basePathStamp()}:${configStamp()}:${renderToolchainStamp()}:${extraStamp}:`
  );
  for (const slug of slugs) {
    h.update(slug);
    h.update("\0");
    h.update(mdxSources[slug]);
    h.update("\0");
  }
  return h.digest("hex").slice(0, 16);
}

/**
 * Fingerprint of the resolved `docu.json`.
 *
 * Pages render the sidebar, navbar, repo links and SEO tags from it, and the
 * client bundle inlines it (the `client-routes` virtual module). Neither the
 * page cache (keyed by MDX source) nor the bundle hash (MDX modules plus
 * stylesheets) saw it, so renaming a sidebar entry or the repo URL rebuilt
 * nothing until `--force`. Folded into the bundle hash and the page-asset key,
 * any config edit now rebuilds the bundle and re-renders every page.
 *
 * A missing or unreadable config fingerprints as empty, like the other stamps.
 */
export function configStamp(config: unknown = readConfigForStamp()): string {
  let serialized = "";
  try {
    serialized = JSON.stringify(config) ?? "";
  } catch {
    // circular or otherwise unserializable — treat as no config
  }
  return createHash("sha256").update(serialized).digest("hex").slice(0, 16);
}

function readConfigForStamp(): unknown {
  try {
    return loadDocuConfig();
  } catch {
    return null;
  }
}

/**
 * Page keys recorded in the build cache file on disk, read without checking
 * its version or toolchain stamps.
 *
 * `readCache()` discards the whole cache on `--force` or on any stamp mismatch
 * (every flame upgrade), which also discards the only record of which pages a
 * previous build wrote. Pruning reads the raw file instead, so a page deleted
 * in the same build as one of those events is still removed. A missing or
 * corrupt file yields no keys.
 */
export function previousPageKeys(cacheFile: string): string[] {
  try {
    const parsed: unknown = JSON.parse(readFileSync(cacheFile, "utf-8"));
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return [];
    return Object.keys(parsed).filter((key) => !key.startsWith("__"));
  } catch {
    return [];
  }
}

/**
 * Remove the HTML of pages whose source was deleted or renamed since the
 * previous build, and drop their cache entries.
 *
 * Page cache keys are the MDX paths without extension (`guide/routing`), and
 * each one was written to `<docsOutDir>/<key>.html` by a previous build, so the
 * cache doubles as the list of files Flame owns. `previousKeys` adds the pages
 * a discarded cache recorded (see {@link previousPageKeys}). Without this, a
 * removed page kept being published with stale navigation. Bookkeeping slots
 * (`__meta__`, `__bundle__`, `__assets__`) are skipped, and a key that would
 * resolve outside `docsOutDir` is dropped without touching the filesystem.
 *
 * Call it before writing generated pages that may share a path with a docs
 * page (the docs index, the 404 page), or it would delete them.
 *
 * @returns the removed page keys
 */
export async function pruneRemovedPages(
  cache: Record<string, unknown>,
  currentPages: Iterable<string>,
  docsOutDir: string,
  previousKeys: Iterable<string> = []
): Promise<string[]> {
  const keep = new Set(currentPages);
  const root = resolve(docsOutDir);
  const candidates = new Set([...Object.keys(cache), ...previousKeys]);
  const removed: string[] = [];
  for (const key of candidates) {
    if (key.startsWith("__") || keep.has(key)) continue;
    const output = resolve(root, `${key}.html`);
    if (output.startsWith(root + sep)) await rm(output, { force: true });
    delete cache[key];
    removed.push(key);
  }
  return removed;
}
