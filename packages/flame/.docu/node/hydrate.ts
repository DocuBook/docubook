import { join } from "node:path";
import { mkdir, unlink } from "node:fs/promises";
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

export async function buildClientBundle(): Promise<{ js: string; css: string }> {
  await mkdir(ASSETS_DIR, { recursive: true });
  await cleanOldBundles();

  const nodeEnv = process.env.NODE_ENV || "development";
  const result = await Bun.build({
    entrypoints: [join(LIB_DIR, "client.ts")],
    outdir: ASSETS_DIR,
    format: "esm",
    splitting: true,
    naming: {
      entry: "client-[hash].[ext]",
      chunk: "chunks/[name]-[hash].[ext]",
      asset: "[name]-[hash].[ext]",
    },
    target: "browser",
    minify: nodeEnv === "production",
    optimizeImports: ["lucide-react"],
    define: { "process.env.NODE_ENV": JSON.stringify(nodeEnv) },
    plugins: [
      {
        name: "docu-config",
        setup(build) {
          build.onResolve({ filter: /docu\.json$/ }, (args) => ({
            path: args.path,
            namespace: "docu-config",
          }));
          build.onLoad({ filter: /.*/, namespace: "docu-config" }, () => {
            const config = loadDocuConfig();
            const resolved = {
              ...config,
              routes: resolveRoutes(config.routes as DocuRoute[] | undefined),
            };
            return { contents: JSON.stringify(resolved), loader: "json" };
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
  // With splitting enabled Bun emits entry + chunk artifacts; select the entry
  // explicitly rather than by position (chunks may precede it in the array).
  const entry = result.outputs.find((o) => o.kind === "entry-point");
  if (!entry) {
    throw new Error("Client bundle produced no entry-point output");
  }
  const jsFile = entry.path.split("/").pop()!;
  const tmpCss = join(ASSETS_DIR, "_tmp.css");
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

  const cssHash = new Bun.CryptoHasher("md5").update(cssContent).digest("hex").slice(0, 8);
  const cssFile = `client-${cssHash}.css`;
  await Bun.write(join(ASSETS_DIR, cssFile), cssContent);
  await unlink(tmpCss);

  await Bun.write(join(ASSETS_DIR, "manifest.json"), JSON.stringify({ js: jsFile, css: cssFile }));

  return { js: jsFile, css: cssFile };
}
