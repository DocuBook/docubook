import { join } from "node:path";
import { mkdir, unlink, rename } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolveTheme, generateThemeCss, presetRegistry } from "@docubook/themes-colors";
import { ASSETS_DIR, cleanOldBundles, LIB_DIR, STYLES_DIR, loadDocuConfig } from "./paths";
import { atomicWriteFile, computeTailwindCacheKey, readGlobalsCss } from "./cache-key";
import { resolveRoutes } from "./fs-scanner";
import type { DocuRoute } from "./types";
import type { ThemeConfig } from "@docubook/themes-colors";

const themeRegistry = presetRegistry;

/**
 * Read the effective theme config with this priority:
 * 1. FLAME_THEME env var (CLI --theme flag)
 * 2. docu.json theme.colors field
 */
export function getThemeConfig(): ThemeConfig | undefined {
  if (process.env.FLAME_THEME) {
    return process.env.FLAME_THEME;
  }
  const config = loadDocuConfig();
  return config.themes?.colors;
}

/**
 * Append theme CSS to compiled Tailwind output based on theme config.
 */
export function buildThemeCss(baseCss: string, themeConfig: unknown): string {
  try {
    const resolved = resolveTheme(themeConfig as ThemeConfig | undefined | null, themeRegistry);
    return baseCss + "\n" + generateThemeCss(resolved);
  } catch (err) {
    console.warn(
      `[flame] Failed to resolve theme CSS: ${err instanceof Error ? err.message : String(err)}`
    );
    return baseCss;
  }
}

/**
 * Compute inline theme CSS for FOUC prevention.
 * Returns undefined if no theme is configured or on error.
 */
export function computeInlineThemeCss(): string | undefined {
  try {
    const themeColors = getThemeConfig();
    if (themeColors) {
      const resolved = resolveTheme(themeColors, themeRegistry);
      return generateThemeCss(resolved);
    }
  } catch (err) {
    console.warn(
      `[flame] Failed to compute inline theme CSS: ${err instanceof Error ? err.message : String(err)}`
    );
  }
  return undefined;
}

/** Compute Tailwind cache key from globals.css + theme + config + toolchain. */
function twCacheKey(): string {
  const globals = readGlobalsCss();
  let themeSuffix = "";
  try {
    const themeColors = getThemeConfig();
    if (themeColors) themeSuffix = JSON.stringify(themeColors);
  } catch {
    // theme config unavailable — proceed without
  }
  return computeTailwindCacheKey(globals, themeSuffix);
}

/** Run Tailwind CLI, caching by content hash. */
async function buildTailwindCss(key: string): Promise<{ file: string; content: string }> {
  const cachedFile = `client-${key}.css`;
  const cachedPath = join(ASSETS_DIR, cachedFile);

  if (existsSync(cachedPath)) {
    const content = await Bun.file(cachedPath).text();
    return { file: cachedFile, content };
  }

  const tmpCss = join(ASSETS_DIR, `_tmp-${key}.css`);
  const proc = Bun.spawn(
    [
      "bun",
      "x",
      "@tailwindcss/cli",
      "-i",
      join(STYLES_DIR, "globals.css"),
      "-o",
      tmpCss,
      "--minify",
    ],
    { stdout: "ignore", stderr: "pipe" }
  );
  await proc.exited;
  if (proc.exitCode !== 0) {
    const err = await new Response(proc.stderr).text();
    throw new Error(`Tailwind CSS build failed:\n${err}`);
  }

  let cssContent = await Bun.file(tmpCss).text();
  await unlink(tmpCss).catch(() => {});

  try {
    const themeColors = getThemeConfig();
    if (themeColors) cssContent = buildThemeCss(cssContent, themeColors);
  } catch (err) {
    console.warn(
      `[flame] Failed to resolve theme config: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const cssFile = `client-${key}.css`;
  const outPath = join(ASSETS_DIR, cssFile);
  // Atomic tmp+rename with pid suffix: parallel builds never clobber each
  // other, and a crash cannot leave a half-written CSS file behind.
  if (!existsSync(outPath)) {
    const { writeFile } = await import("node:fs/promises");
    await atomicWriteFile(writeFile, rename, unlink, outPath, cssContent);
  }

  return { file: cssFile, content: cssContent };
}

export async function buildClientBundle(
  /** slug → compiled MDX ESM module source (program format) for static hydration. */
  mdxSources: Record<string, string> = {}
): Promise<{ js: string; css: string }> {
  await mkdir(ASSETS_DIR, { recursive: true });
  const twKey = twCacheKey();
  await cleanOldBundles(new Set([`client-${twKey}.css`]));

  const nodeEnv = process.env.NODE_ENV || "development";
  const result = await Bun.build({
    entrypoints: [join(LIB_DIR, "client.ts")],
    outdir: ASSETS_DIR,
    naming: "client-[hash].[ext]",
    target: "browser",
    minify: nodeEnv === "production",
    define: { "process.env.NODE_ENV": JSON.stringify(nodeEnv) },
    plugins: [
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
      {
        // Serves per-page compiled MDX (program format) as real modules so
        // the client hydrates the content island without `new Function`.
        // client.ts imports `{ mdxModules } from "./mdx-manifest"`.
        name: "mdx-hydrate",
        setup(build) {
          build.onResolve({ filter: /^mdx-module:/ }, (args) => ({
            path: args.path,
            namespace: "mdx-module",
          }));
          build.onLoad({ filter: /.*/, namespace: "mdx-module" }, (args) => {
            const slug = args.path.slice("mdx-module:".length);
            const contents = mdxSources[slug];
            if (contents == null) {
              return {
                errors: [{ text: `unknown mdx module: ${slug}` }],
                contents: "",
                loader: "js",
              };
            }
            return { contents, loader: "js" };
          });
          build.onResolve({ filter: /mdx-manifest$/ }, (args) => ({
            path: args.path,
            namespace: "mdx-manifest",
          }));
          build.onLoad({ filter: /.*/, namespace: "mdx-manifest" }, () => {
            // Sort keys: the prePass fills mdxSources via Promise.all, so
            // insertion order = resolution order (non-deterministic across
            // processes). Stable key order keeps the bundle hash stable so
            // the build cache (`assetsChanged`) actually hits.
            const slugs = Object.keys(mdxSources).sort();
            const imports = slugs
              .map((slug, i) => {
                const key = slug.replace(/["\\]/g, "");
                return `import * as _mdx${i} from "mdx-module:${key}";`;
              })
              .join("\n");
            const map = slugs.map((slug, i) => `${JSON.stringify(slug)}: _mdx${i}`).join(", ");
            return {
              contents: `${imports}\nexport const mdxModules = { ${map} };\n`,
              loader: "js",
            };
          });
        },
      },
    ],
  });

  if (!result.success) {
    for (const log of result.logs) console.error(log);
    throw new Error("Client bundle failed");
  }

  if (!result.outputs[0]) {
    throw new Error("Client bundle produced no output files");
  }
  const entry = result.outputs.find((o) => o.kind === "entry-point");
  if (!entry) {
    throw new Error("Client bundle produced no entry-point output");
  }
  const jsFile = entry.path.split("/").pop()!;

  const { file: cssFile } = await buildTailwindCss(twKey);

  await Bun.write(join(ASSETS_DIR, "manifest.json"), JSON.stringify({ js: jsFile, css: cssFile }));

  return { js: jsFile, css: cssFile };
}
