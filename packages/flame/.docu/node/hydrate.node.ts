/** Client bundle builder for Node/Deno runtimes. */

import { execFile } from "node:child_process";
import { builtinModules, createRequire } from "node:module";
import { dirname, join } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { promisify } from "node:util";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { build as viteBuild, type Plugin, type Rollup } from "vite";
import {
  ASSETS_DIR,
  cleanOldBundles,
  LIB_DIR,
  STYLES_DIR,
  loadDocuConfig,
  resolveBasePath,
  servedDeployPath,
} from "./paths";
import { buildThemeCss, createMdxModuleEntries, getThemeConfig } from "./hydrate";
import { atomicWriteFile, computeTailwindCacheKey, readStyleCss } from "./cache-key";
import { resolveRoutes } from "./fs-scanner";
import type { AssetManifest, DocuRoute } from "./types";

export { buildThemeCss, computeInlineThemeCss, getThemeConfig } from "./hydrate";

export function viteChunkFileName(chunk: { name: string }): string {
  const name = chunk.name.replace(/^_docubook-mdx-page-/, "docubook-mdx-page-");
  return `chunks/${name}-[hash].js`;
}

/**
 * Drop Rolldown's MODULE_LEVEL_DIRECTIVE warning for directives that mean
 * nothing in this client-only bundle: `"use client"` (our components and
 * @docubook/ui-react's) and the empty `''` statement left by JSDoc-only
 * `@import` blocks in @mdx-js/mdx and hast-util-to-estree. Each printed a
 * multi-line diagnostic on every build. Other warnings pass through.
 */
export function clientBuildOnWarn(
  warning: Rollup.RollupLog,
  warn: (warning: Rollup.RollupLog) => void
): void {
  if (
    warning.code === "MODULE_LEVEL_DIRECTIVE" &&
    /module level directive "(use client)?" in /.test(warning.message)
  )
    return;
  warn(warning);
}

const execFileAsync = promisify(execFile);

function resolveTailwindBin(): string {
  const require = createRequire(import.meta.url);
  const pkgPath = require.resolve("@tailwindcss/cli/package.json");
  const pkg = require(pkgPath) as { bin: string | Record<string, string> };
  const binRel = typeof pkg.bin === "string" ? pkg.bin : pkg.bin.tailwindcss;
  return join(dirname(pkgPath), binRel);
}

function themeCacheSuffix(): string {
  try {
    const themeColors = getThemeConfig();
    return themeColors ? JSON.stringify(themeColors) : "";
  } catch {
    return "";
  }
}

function tailwindCacheKey(styleFile: string): string {
  return computeTailwindCacheKey(readStyleCss(styleFile), `${styleFile}\0${themeCacheSuffix()}`);
}

/**
 * Fingerprint of every style input that shapes the emitted CSS: the route
 * entries (`globals.css`, `site.css`) plus everything they import — relative
 * files and package stylesheets — and the resolved theme. Mirrors
 * `hydrate.ts` so both runtimes agree on when the bundle must rebuild.
 */
export function cssBundleStamp(): string {
  return `${tailwindCacheKey("globals.css")}\0${tailwindCacheKey("site.css")}`;
}

async function buildTailwindCss(
  name: string,
  styleFile: string
): Promise<{ file: string; content: string }> {
  const key = tailwindCacheKey(styleFile);
  const cachedFile = `${name}-${key}.css`;
  const cachedPath = join(ASSETS_DIR, cachedFile);

  if (existsSync(cachedPath)) {
    return { file: cachedFile, content: readFileSync(cachedPath, "utf-8") };
  }

  const tmpCss = join(ASSETS_DIR, `_tmp-${name}-${key}.css`);
  const bin = resolveTailwindBin();
  const tailwindArgs = ["-i", join(STYLES_DIR, styleFile), "-o", tmpCss, "--minify"];
  const isDeno = "Deno" in globalThis;
  const args = isDeno ? ["run", "-A", bin, ...tailwindArgs] : [bin, ...tailwindArgs];
  try {
    await execFileAsync(process.execPath, args, { maxBuffer: 16 * 1024 * 1024 });
  } catch (err) {
    const stderr = (err as { stderr?: string }).stderr ?? String(err);
    throw new Error(`Tailwind CSS build failed:\n${stderr}`, { cause: err });
  }

  let cssContent = await readFile(tmpCss, "utf-8");
  await unlink(tmpCss).catch(() => {});

  try {
    const themeColors = getThemeConfig();
    if (themeColors) cssContent = buildThemeCss(cssContent, themeColors);
  } catch (err) {
    console.warn(
      `[flame] Failed to resolve theme config: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (!existsSync(cachedPath)) {
    await atomicWriteFile(writeFile, rename, unlink, cachedPath, cssContent);
  }

  return { file: cachedFile, content: cssContent };
}

const NODE_BUILTINS_RE = new RegExp(
  `^(node:.*|${builtinModules.map((module) => module.replace(/\//g, "\\/")).join("|")})$`
);

/**
 * Stubs Node built-ins in the browser bundle with an empty default export.
 *
 * Runs before core resolution, or Vite swaps in its own browser externals and
 * this never runs. The stub has no named exports on purpose: a server module
 * leaking into the client graph (`import { resolve } from "node:path"`) then
 * fails the build with MISSING_EXPORT instead of crashing every page at
 * runtime. Default imports in browser-safe dependencies (gray-matter's
 * `fs`) still get an empty object.
 */
export function nodeBuiltinStubPlugin(): Plugin {
  return {
    name: "node-builtin-stub",
    enforce: "pre",
    resolveId(id) {
      if (NODE_BUILTINS_RE.test(id)) return `\0node-stub:${id}`;
      return null;
    },
    load(id) {
      if (!id.startsWith("\0node-stub:")) return null;
      return "export default {}; export {};";
    },
  };
}

/**
 * Serves `node/client-routes` as a virtual module built from `docu.json`, so the
 * browser bundle gets resolved config values instead of the server-side file.
 *
 * `deploymentPath` is resolved by the caller before the Vite build starts:
 * Vite sets `process.env.NODE_ENV` to "production" while it builds, so a
 * `servedDeployPath()` evaluated in `load()` would bake the production path
 * into a dev bundle.
 */
export function docuConfigPlugin(deploymentPath: string = servedDeployPath()): Plugin {
  return {
    name: "docu-config",
    // `node/client-routes.ts` is a real (server-side) file, so Vite's own
    // resolver would claim the import first and bundle it — dragging
    // paths.ts and node built-ins into the browser and breaking hydration.
    // Run before core resolution so the virtual module always wins.
    enforce: "pre",
    resolveId(id) {
      if (!/client-routes$/.test(id)) return null;
      return "\0client-routes";
    },
    load(id) {
      if (id !== "\0client-routes") return null;
      const config = loadDocuConfig();
      const resolved = {
        ...config,
        routes: resolveRoutes(config.routes as DocuRoute[] | undefined),
      };
      return [
        `const docuConfig = ${JSON.stringify(resolved)};`,
        `export const routes = docuConfig.routes || [];`,
        `export const config = docuConfig;`,
        `export const basePath = ${JSON.stringify(resolveBasePath(config))};`,
        // Dev serves the project from the origin root, so the host's
        // deployment path only reaches the production bundle.
        `export const deployPath = ${JSON.stringify(deploymentPath)};`,
      ].join("\n");
    },
  };
}

let clientBuildQueue: Promise<void> = Promise.resolve();

/**
 * Run client builds one at a time. The dev server rebuilds on file changes
 * with only a debounce, so two builds could overlap — and each one saves and
 * restores `process.env.NODE_ENV` around Vite (see `runClientBuild`). An
 * overlapping build would capture the "production" value a sibling build has
 * just leaked and pin it for the rest of the process. A failed build does not
 * block the next one.
 *
 * @internal Exported for tests.
 */
export function enqueueClientBuild<T>(task: () => Promise<T>): Promise<T> {
  const result = clientBuildQueue.then(task);
  clientBuildQueue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

export function buildClientBundle(
  /** slug → compiled MDX ESM module source (program format) for static hydration. */
  mdxSources: Record<string, string> = {}
): Promise<AssetManifest> {
  return enqueueClientBuild(() => runClientBuild(mdxSources));
}

async function runClientBuild(mdxSources: Record<string, string>): Promise<AssetManifest> {
  await mkdir(ASSETS_DIR, { recursive: true });
  await cleanOldBundles();
  const nodeEnv = process.env.NODE_ENV || "development";
  // Vite assigns process.env.NODE_ENV = "production" when it is unset and
  // leaves it that way. Under the dev server that flips servedDeployPath()
  // (and anything else keyed on NODE_ENV) to production for the rest of the
  // process, so capture what this build needs first and restore it after.
  const envBeforeBuild = process.env.NODE_ENV;
  const servedDeploy = servedDeployPath();
  const mdxEntries = createMdxModuleEntries(mdxSources);
  const mdxEntriesById = new Map(mdxEntries.map((entry) => [entry.id, entry]));
  const docsEntryPath = join(LIB_DIR, "client.ts");
  const homeEntryPath = join(LIB_DIR, "home-client.ts");

  let bundle: Awaited<ReturnType<typeof viteBuild>>;
  try {
    bundle = await viteBuild({
      configFile: false,
      publicDir: false,
      // outDir is the assets directory itself, so emitted paths ("chunks/x.js")
      // are relative to it. The default base "/" made Vite's preload helper
      // request "/chunks/x.js" (404). A relative base resolves preloads from the
      // importing chunk's URL instead of the site root.
      base: "./",
      define: { "process.env.NODE_ENV": JSON.stringify(nodeEnv) },
      plugins: [
        nodeBuiltinStubPlugin(),
        docuConfigPlugin(servedDeploy),
        {
          name: "mdx-hydrate",
          resolveId(id) {
            if (/mdx-manifest$/.test(id)) return "\0mdx-manifest";
            if (/^docubook-mdx-page-[a-f0-9]{16}$/.test(id)) return `\0${id}`;
            return null;
          },
          load(id) {
            if (id === "\0mdx-manifest") {
              const map = mdxEntries
                .map(
                  ({ slug, id }) => `${JSON.stringify(slug)}: () => import(${JSON.stringify(id)})`
                )
                .join(", ");
              return `export const mdxModules = { ${map} };\n`;
            }
            if (!id.startsWith("\0docubook-mdx-page-")) return null;
            const entry = mdxEntriesById.get(id.slice(1));
            const contents = entry == null ? undefined : mdxSources[entry.slug];
            if (contents == null) throw new Error(`unknown mdx module: ${id}`);
            return contents;
          },
        },
      ],
      build: {
        outDir: ASSETS_DIR,
        emptyOutDir: false,
        sourcemap: true,
        minify: nodeEnv === "production",
        target: "es2020",
        rollupOptions: {
          input: { client: docsEntryPath, "home-client": homeEntryPath },
          onwarn: clientBuildOnWarn,
          output: {
            format: "es",
            entryFileNames: "[name]-[hash].js",
            chunkFileNames: viteChunkFileName,
            assetFileNames: "assets/[name]-[hash][extname]",
          },
        },
      },
    });
  } finally {
    if (envBeforeBuild === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = envBeforeBuild;
  }

  const outputs = Array.isArray(bundle) ? bundle : [bundle];
  let docsJs: string | undefined;
  let homeJs: string | undefined;
  for (const item of outputs) {
    if (!("output" in item)) continue;
    for (const output of item.output) {
      if (output.type !== "chunk" || !output.isEntry) continue;
      if (output.name === "client") docsJs = output.fileName;
      if (output.name === "home-client") homeJs = output.fileName;
    }
  }
  if (!docsJs || !homeJs) {
    throw new Error("Client bundle produced incomplete entry-point outputs");
  }

  const [{ file: docsCss }, { file: siteCss }] = await Promise.all([
    buildTailwindCss("docs", "globals.css"),
    buildTailwindCss("site", "site.css"),
  ]);

  const manifest: AssetManifest = {
    docs: { js: docsJs, css: docsCss },
    home: { js: homeJs, css: siteCss },
    notFound: { css: siteCss },
  };
  await writeFile(join(ASSETS_DIR, "manifest.json"), JSON.stringify(manifest));
  return manifest;
}
