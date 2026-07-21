import { join } from "node:path";
import { mkdir, unlink } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolveTheme, generateThemeCss, presetRegistry } from "@docubook/themes-colors";
import { ASSETS_DIR, cleanOldBundles, LIB_DIR, STYLES_DIR, loadDocuConfig } from "./paths";
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

/** Compute Tailwind cache key from globals.css + theme config. */
function twCacheKey(): string {
  const globalsPath = join(STYLES_DIR, "globals.css");
  const globals = existsSync(globalsPath) ? readFileSync(globalsPath, "utf-8") : "";
  let themeSuffix = "";
  try {
    const themeColors = getThemeConfig();
    if (themeColors) themeSuffix = JSON.stringify(themeColors);
  } catch {
    // theme config unavailable — proceed without
  }
  return createHash("md5")
    .update(globals + themeSuffix)
    .digest("hex")
    .slice(0, 16);
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
  await unlink(tmpCss);

  try {
    const themeColors = getThemeConfig();
    if (themeColors) cssContent = buildThemeCss(cssContent, themeColors);
  } catch (err) {
    console.warn(
      `[flame] Failed to resolve theme config: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // Use the same input-derived key for lookup and output — if inputs change,
  // the key changes, cache busting works without a separate content hash.
  const cssFile = `client-${key}.css`;
  const outPath = join(ASSETS_DIR, cssFile);
  if (!existsSync(outPath)) await Bun.write(outPath, cssContent);

  return { file: cssFile, content: cssContent };
}

export async function buildClientBundle(): Promise<{ js: string; css: string }> {
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
          // Inline docu.json imports for the browser bundle —
          // resolves the config once at build time instead of baking in a
          // relative path that breaks when the package is installed from npm.
          build.onResolve({ filter: /client-routes\.ts$/ }, (args) => ({
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
