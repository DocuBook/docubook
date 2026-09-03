import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { FRAMEWORK_ROOT, STYLES_DIR, resolveProjectFile } from "./paths";

/**
 * Build cache version — bump when the toolchain output contract changes
 * (e.g. Bun.build barrel optimization, Tailwind CLI upgrade). Old caches
 * with a mismatched version are discarded on read (see build.ts readCache).
 */
export const BUILD_CACHE_VERSION = 3;

/** Toolchain fingerprint: Bun version on Bun, Deno version on Deno, Node elsewhere. */
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

/** Resolve `./` + `../` imports only — bare specifiers are version-pinned deps. */
function resolveRelativeImport(spec: string, fromDir: string): string | undefined {
  if (!spec.startsWith(".")) return undefined;
  const clean = spec.split("?")[0]!.split("#")[0]!;
  if (clean.length === 0) return undefined;
  return join(fromDir, clean);
}

/**
 * Read a CSS file plus transitively imported relative files.
 * Non-relevant files contribute "" themselves, but their imports are still
 * followed (nested file may carry `@theme`). `visited` breaks import cycles.
 * Missing/unreadable files resolve to "" — never throws.
 */
function readCssWithImports(path: string, visited: Set<string>, depth = 0): string {
  if (depth > MAX_IMPORT_DEPTH || visited.has(path)) return "";
  visited.add(path);
  let content = "";
  try {
    if (!existsSync(path)) return "";
    content = readFileSync(path, "utf-8");
  } catch {
    return "";
  }
  let out = isTailwindRelevantCss(content) ? content : "";
  try {
    const dir = join(path, "..");
    for (const m of content.matchAll(IMPORT_RE)) {
      const resolved = resolveRelativeImport(m[1] ?? "", dir);
      if (resolved) out += readCssWithImports(resolved, visited, depth + 1);
    }
  } catch {
    // import scan failed — keep what we have
  }
  return out;
}

function scanCssDir(dir: string, visited: Set<string>): string {
  let out = "";
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === "assets" || e.name.startsWith(".") || e.name === "node_modules") continue;
        out += scanCssDir(full, visited);
      } else if (e.name.endsWith(".css")) {
        out += readCssWithImports(full, visited);
      }
    }
  } catch {
    // docs/ missing — nothing to add
  }
  return out;
}

function scanRootCss(root: string, visited: Set<string>): string {
  let out = "";
  try {
    const entries = readdirSync(root, { withFileTypes: true });
    for (const e of entries) {
      if (e.isFile() && e.name.endsWith(".css")) {
        out += readCssWithImports(join(root, e.name), visited);
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
  return scanCssDir(join(root, "docs"), visited) + scanRootCss(root, visited);
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
  h.update(`v${BUILD_CACHE_VERSION}`);
  return h.digest("hex").slice(0, 16);
}

/** Read globals.css content ("" when missing). Shared by both hydrators. */
export function readGlobalsCss(): string {
  const globalsPath = join(STYLES_DIR, "globals.css");
  return existsSync(globalsPath) ? readFileSync(globalsPath, "utf-8") : "";
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
 * Hash of compiled MDX module sources (sorted keys + content).
 * Used to skip the JS bundle rebuild when no page content changed.
 */
export function hashMdxSources(mdxSources: Record<string, string>): string {
  const h = createHash("sha256");
  const slugs = Object.keys(mdxSources).sort();
  h.update(`v${BUILD_CACHE_VERSION}:${runtimeStamp()}:`);
  for (const slug of slugs) {
    h.update(slug);
    h.update("\0");
    h.update(mdxSources[slug]);
    h.update("\0");
  }
  return h.digest("hex").slice(0, 16);
}
