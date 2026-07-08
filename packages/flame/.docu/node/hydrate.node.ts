/**
 * Runtime-neutral client bundling — esbuild port of `buildClientBundle()`
 * from `hydrate.ts` (Bun-only, protected). Used by the Node/Deno entries;
 * the Bun entries keep using `Bun.build` untouched. The pure theme helpers
 * (`getThemeConfig`, `buildThemeCss`, `computeInlineThemeCss`) are reused
 * from `hydrate.ts` — that module only touches Bun APIs inside
 * `buildClientBundle` itself, so importing it is safe on any runtime.
 */

import { execFile } from "node:child_process";
import { builtinModules, createRequire } from "node:module";
import { basename, dirname, join, resolve } from "node:path";
import { promisify } from "node:util";
import { mkdir, readFile, readdir, rm, unlink, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { ASSETS_DIR, LIB_DIR, STYLES_DIR, loadDocuConfig } from "./paths";
import { buildThemeCss, getThemeConfig } from "./hydrate";
import { resolveRoutes } from "./fs-scanner";
import type { DocuRoute } from "./types";

export { buildThemeCss, computeInlineThemeCss, getThemeConfig } from "./hydrate";

const execFileAsync = promisify(execFile);

async function cleanOldBundles() {
  try {
    const files = await readdir(ASSETS_DIR);
    for (const file of files) {
      if (file.startsWith("client.") || file.startsWith("client-")) {
        await unlink(join(ASSETS_DIR, file));
      }
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error("Failed to clean old bundles:", (err as Error).message);
    }
  }
  try {
    await rm(join(ASSETS_DIR, "chunks"), { recursive: true, force: true });
  } catch (err) {
    console.error("Failed to clean old chunks:", (err as Error).message);
  }
}

function resolveTailwindBin(): string {
  const require = createRequire(import.meta.url);
  const pkgPath = require.resolve("@tailwindcss/cli/package.json");
  const pkg = require(pkgPath) as { bin: string | Record<string, string> };
  const binRel = typeof pkg.bin === "string" ? pkg.bin : pkg.bin.tailwindcss;
  return join(dirname(pkgPath), binRel);
}

async function runTailwind(outputCss: string): Promise<void> {
  const bin = resolveTailwindBin();
  const twArgs = ["-i", join(STYLES_DIR, "globals.css"), "-o", outputCss, "--minify"];
  // Deno's process.execPath is the deno binary, which needs the `run` subcommand.
  const isDeno = "Deno" in globalThis;
  const args = isDeno ? ["run", "-A", bin, ...twArgs] : [bin, ...twArgs];
  try {
    await execFileAsync(process.execPath, args, { maxBuffer: 16 * 1024 * 1024 });
  } catch (err) {
    const stderr = (err as { stderr?: string }).stderr ?? String(err);
    throw new Error(`Tailwind CSS build failed:\n${stderr}`, { cause: err });
  }
}

export async function buildClientBundle(): Promise<{ js: string; css: string }> {
  await mkdir(ASSETS_DIR, { recursive: true });
  await cleanOldBundles();

  const nodeEnv = process.env.NODE_ENV || "development";
  const esbuild = await import("esbuild");
  const { build } = esbuild;

  const entryPath = join(LIB_DIR, "client.ts");
  // esbuild metafile paths are relative to absWorkingDir (defaults to cwd).
  const workingDir = process.cwd();
  let result: Awaited<ReturnType<typeof build>>;
  try {
    result = await build({
      entryPoints: [join(LIB_DIR, "client.ts")],
      bundle: true,
      outdir: ASSETS_DIR,
      entryNames: "client-[hash]",
      chunkNames: "chunks/[name]-[hash]",
      platform: "browser",
      format: "esm",
      splitting: true,
      minify: nodeEnv === "production",
      define: { "process.env.NODE_ENV": JSON.stringify(nodeEnv) },
      jsx: "automatic",
      jsxDev: nodeEnv !== "production",
      metafile: true,
      logLevel: "silent",
      plugins: [
        {
          // The client graph reaches modules that import node builtins for
          // their server-only exports (e.g. utils.ts, core's content module).
          // Bun.build tolerates this for browser targets; esbuild needs empty
          // CJS stubs (named imports become undefined, matching the
          // never-called server paths).
          name: "node-builtin-stub",
          setup(build) {
            const builtins = builtinModules.map((m) => m.replace(/\//g, "\\/")).join("|");
            build.onResolve({ filter: new RegExp(`^(node:.*|${builtins})$`) }, (args) => ({
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
        {
          name: "mdx-jsx-runtime",
          setup(build) {
            build.onLoad({ filter: /next-mdx-remote[/\\].*jsx-runtime/ }, () => {
              const source =
                nodeEnv === "production"
                  ? `module.exports.jsxRuntime = require("react/jsx-runtime");`
                  : `module.exports.jsxRuntime = require("react/jsx-dev-runtime");`;
              return { contents: source, loader: "js" };
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

  // With splitting enabled esbuild emits the entry plus shared/dynamic chunks.
  // `entryPoint` is set on the user entry AND on every dynamic-import chunk
  // (esbuild treats dynamic imports as entry points), so match the resolved
  // source path instead of grabbing the first truthy `entryPoint`.
  const jsOutput = Object.keys(result.metafile.outputs).find((p) => {
    const o = result.metafile.outputs[p];
    return o.entryPoint && resolve(workingDir, o.entryPoint) === entryPath;
  });
  if (!jsOutput) {
    throw new Error("Client bundle produced no output files");
  }
  const jsFile = basename(jsOutput);

  const tmpCss = join(ASSETS_DIR, "_tmp.css");
  await runTailwind(tmpCss);

  let cssContent = await readFile(tmpCss, "utf-8");

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

  const cssHash = createHash("md5").update(cssContent).digest("hex").slice(0, 8);
  const cssFile = `client-${cssHash}.css`;
  await writeFile(join(ASSETS_DIR, cssFile), cssContent);
  await unlink(tmpCss);

  await writeFile(join(ASSETS_DIR, "manifest.json"), JSON.stringify({ js: jsFile, css: cssFile }));

  return { js: jsFile, css: cssFile };
}
