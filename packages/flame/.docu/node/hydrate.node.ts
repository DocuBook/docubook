/**
 * Client bundle builder for Node/Deno runtimes.
 *
 * Wraps esbuild with the plugins needed to produce a browser-ready client
 * bundle (JS + CSS) from the same components Bun.build handles natively.
 * Theme helpers (getThemeConfig, buildThemeCss, computeInlineThemeCss)
 * are re-exported from `hydrate.ts` — that module's `buildClientBundle`
 * is Bun-only and unused here.
 */

import { execFile } from "node:child_process";
import { builtinModules, createRequire } from "node:module";
import { basename, dirname, join, resolve } from "node:path";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { promisify } from "node:util";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import {
  ASSETS_DIR,
  FRAMEWORK_ROOT,
  cleanOldBundles,
  LIB_DIR,
  STYLES_DIR,
  loadDocuConfig,
} from "./paths";
import { buildThemeCss, getThemeConfig } from "./hydrate";
import { resolveRoutes } from "./fs-scanner";
import { normalizeImporterPath } from "./security";
import type { DocuConfig, DocuRoute } from "./types";

/** Extract Lucide icon names from user docu.json configuration. */
function extractConfigIcons(config: DocuConfig): string[] {
  const icons: string[] = [];
  const pushIf = (s: string | undefined) => {
    if (s) icons.push(s);
  };
  config.home?.hero?.actions?.forEach((a) => pushIf(a.icon));
  config.home?.features?.forEach((f) => pushIf(f.icon));
  (function walk(routes: DocuRoute[]) {
    for (const r of routes) {
      pushIf(r.context?.icon);
      if (r.items) walk(r.items);
    }
  })(config.routes ?? []);
  return [...new Set(icons.filter((n) => /^[A-Z]/.test(n)))];
}

export { buildThemeCss, computeInlineThemeCss, getThemeConfig } from "./hydrate";

const execFileAsync = promisify(execFile);

/** Resolve the @tailwindcss/cli binary path from the installed package. */
function resolveTailwindBin(): string {
  const require = createRequire(import.meta.url);
  const pkgPath = require.resolve("@tailwindcss/cli/package.json");
  const pkg = require(pkgPath) as { bin: string | Record<string, string> };
  const binRel = typeof pkg.bin === "string" ? pkg.bin : pkg.bin.tailwindcss;
  return join(dirname(pkgPath), binRel);
}

/** Compute a cache key from globals.css + theme config content. */
function tailwindCacheKey(): string {
  const globalsPath = join(STYLES_DIR, "globals.css");
  const globalsContent = existsSync(globalsPath) ? readFileSync(globalsPath, "utf-8") : "";
  let themeSuffix = "";
  try {
    const themeColors = getThemeConfig();
    if (themeColors) {
      themeSuffix = JSON.stringify(themeColors);
    }
  } catch {
    // theme config unavailable — proceed without it
  }
  return createHash("md5")
    .update(globalsContent + themeSuffix)
    .digest("hex")
    .slice(0, 16);
}

/**
 * Build Tailwind CSS with content-based caching.
 * If a CSS file for the current input hash already exists, skip the subprocess.
 * Returns the filename (e.g. "client-abc123.css") and CSS content.
 */
async function buildTailwindCss(key: string): Promise<{ file: string; content: string }> {
  const cachedFile = `client-${key}.css`;
  const cachedPath = join(ASSETS_DIR, cachedFile);

  if (existsSync(cachedPath)) {
    const content = readFileSync(cachedPath, "utf-8");
    return { file: cachedFile, content };
  }

  const tmpCss = join(ASSETS_DIR, `_tmp-${key}.css`);
  const bin = resolveTailwindBin();
  const twArgs = ["-i", join(STYLES_DIR, "globals.css"), "-o", tmpCss, "--minify"];
  const isDeno = "Deno" in globalThis;
  const args = isDeno ? ["run", "-A", bin, ...twArgs] : [bin, ...twArgs];
  try {
    await execFileAsync(process.execPath, args, { maxBuffer: 16 * 1024 * 1024 });
  } catch (err) {
    const stderr = (err as { stderr?: string }).stderr ?? String(err);
    throw new Error(`Tailwind CSS build failed:\n${stderr}`, { cause: err });
  }

  let cssContent = await readFile(tmpCss, "utf-8");
  await unlink(tmpCss);

  try {
    const themeColors = getThemeConfig();
    if (themeColors) {
      cssContent = buildThemeCss(cssContent, themeColors);
    }
  } catch (err) {
    console.warn(
      `[flame] Failed to resolve theme config, falling back to globals.css only: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // Use the same input-derived key for lookup and output — if inputs change,
  // the key changes, cache busting works without a separate content hash.
  const cssFile = `client-${key}.css`;
  const outPath = join(ASSETS_DIR, cssFile);

  if (!existsSync(outPath)) {
    await writeFile(outPath, cssContent);
  }

  return { file: cssFile, content: cssContent };
}

const NODE_BUILTINS_RE = new RegExp(
  `^(node:.*|${builtinModules.map((m) => m.replace(/\//g, "\\/")).join("|")})$`
);

let lucideRealEntry: string | undefined;

/** Resolve the real lucide-react entry path once (cached). */
function getLucideRealEntry(): string {
  if (!lucideRealEntry) {
    lucideRealEntry = createRequire(import.meta.url).resolve("lucide-react");
  }
  return lucideRealEntry;
}

const LUCIDE_IMPORT_RE = /import\s*\{([^}]+)\}\s*from\s*["']lucide-react["']/g;
const LUCIDE_ICON_RE = /^[A-Z]/;

/** Walk a directory scanning JS/TS/TSX files for `lucide-react` named imports. */
function scanDirLucideIcons(dir: string, set: Set<string>): void {
  if (!existsSync(dir)) return;
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name !== "node_modules") scanDirLucideIcons(full, set);
      } else if (/\.(js|ts|tsx)$/.test(e.name)) {
        const content = readFileSync(full, "utf-8");
        for (const m of content.matchAll(LUCIDE_IMPORT_RE)) {
          for (const s of m[1].split(",")) {
            const name = s
              .trim()
              .split(/\s+as\s+/)[0]
              .trim();
            if (LUCIDE_ICON_RE.test(name)) set.add(name);
          }
        }
      }
    }
  } catch (err) {
    console.warn(
      `[flame] Failed to scan lucide icons: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

/** Collect every lucide icon name imported across flame sources and deps. */
function collectAllLucideIcons(): string[] {
  const icons = new Set<string>();
  // Scan flame's own components and pages
  scanDirLucideIcons(join(FRAMEWORK_ROOT, ".docu/components"), icons);
  scanDirLucideIcons(join(FRAMEWORK_ROOT, ".docu/pages"), icons);
  // Scan dependency dist directories. In development (monorepo) they live under
  // packages/; in production they are under node_modules/@docubook/.
  const depDirs = [
    join(FRAMEWORK_ROOT, "..", "mdx-content", "dist"),
    join(FRAMEWORK_ROOT, "..", "ui-react", "dist"),
    join(FRAMEWORK_ROOT, "..", "core", "dist"),
    join(FRAMEWORK_ROOT, "..", "runt", "dist"),
    join(FRAMEWORK_ROOT, "..", "themes-colors", "dist"),
  ];
  for (const d of depDirs) scanDirLucideIcons(resolve(d), icons);
  return [...icons];
}

/** Build the client JS bundle and Tailwind CSS. */
export async function buildClientBundle(): Promise<{ js: string; css: string }> {
  await mkdir(ASSETS_DIR, { recursive: true });
  const twKey = tailwindCacheKey();
  await cleanOldBundles(new Set([`client-${twKey}.css`]));

  const nodeEnv = process.env.NODE_ENV || "development";
  const esbuild = await import("esbuild");
  const { build } = esbuild;

  const entryPath = join(LIB_DIR, "client.ts");
  const workingDir = process.cwd();
  let result: Awaited<ReturnType<typeof build>>;
  try {
    result = await build({
      entryPoints: [entryPath],
      bundle: true,
      outdir: ASSETS_DIR,
      entryNames: "client-[hash]",
      platform: "browser",
      format: "esm",
      minify: nodeEnv === "production",
      define: { "process.env.NODE_ENV": JSON.stringify(nodeEnv) },
      jsx: "automatic",
      jsxDev: nodeEnv !== "production",
      metafile: true,
      logLevel: "silent",
      plugins: [
        {
          name: "node-builtin-stub",
          setup(build) {
            build.onResolve({ filter: NODE_BUILTINS_RE }, (args) => ({
              path: args.path,
              namespace: "node-stub",
            }));
            build.onLoad({ filter: /.*/, namespace: "node-stub" }, () => ({
              contents: "module.exports = {};",
              loader: "js",
            }));
          },
        },
        {
          name: "lucide-optimize",
          setup(build) {
            build.onResolve({ filter: /^lucide-react$/ }, (args) => {
              // Imports from within our virtual module go to the real package.
              if (args.namespace === "lucide-virt") {
                return { path: getLucideRealEntry(), namespace: "file" };
              }
              // mdx-content Icon.tsx uses namespace import for arbitrary
              // user-provided icon names in MDX — keep full barrel there.
              if (args.importer) {
                const normalized = normalizeImporterPath(args.importer);
                if (normalized.includes("/mdx-content/dist/")) {
                  return { path: getLucideRealEntry(), namespace: "file" };
                }
              }
              // All other files get tree-shaken via the virtual module.
              // Lucide.tsx renders only config-defined icons, which are
              // collected by extractConfigIcons() + collectAllLucideIcons().
              return { path: args.path, namespace: "lucide-virt" };
            });
            build.onLoad({ filter: /.*/, namespace: "lucide-virt" }, () => {
              const scanned = collectAllLucideIcons();
              const configured = extractConfigIcons(loadDocuConfig());
              const allIcons = [...new Set([...scanned, ...configured])];
              return {
                contents: `export { ${allIcons.join(", ")} } from "lucide-react";`,
                loader: "js",
              };
            });
          },
        },
        {
          name: "docu-config",
          setup(build) {
            // Components import as "../node/client-routes" (no .ts extension),
            // so filter matches the path tail without requiring the extension.
            build.onResolve({ filter: /client-routes$/ }, (args) => ({
              path: args.path,
              namespace: "client-routes",
            }));
            build.onLoad({ filter: /.*/, namespace: "client-routes" }, () => {
              const config = loadDocuConfig();
              const resolved = {
                ...config,
                routes: resolveRoutes(config.routes as DocuRoute[] | undefined),
              };
              return {
                contents: [
                  `import type { DocuRoute, DocuConfig } from "./types";`,
                  `const docuConfig = ${JSON.stringify(resolved)};`,
                  `export const routes = docuConfig.routes || [];`,
                  `export const config = docuConfig;`,
                ].join("\n"),
                loader: "ts",
              };
            });
          },
        },
      ],
    });
  } finally {
    // esbuild's service child process keeps Deno's event loop alive after a
    // one-shot build (node-compat gap) — stop it so `flame build` exits.
    await esbuild.stop();
  }

  // The single entry produces one output. Match resolved source path.
  const { outputs } = result.metafile!;
  const jsOutput = Object.keys(outputs).find((p) => {
    const o = outputs[p];
    return o.entryPoint && resolve(workingDir, o.entryPoint) === entryPath;
  });
  if (!jsOutput) {
    throw new Error("Client bundle produced no output files");
  }
  const jsFile = basename(jsOutput);

  const { file: cssFile } = await buildTailwindCss(twKey);

  await writeFile(join(ASSETS_DIR, "manifest.json"), JSON.stringify({ js: jsFile, css: cssFile }));

  return { js: jsFile, css: cssFile };
}
