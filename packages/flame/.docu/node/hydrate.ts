import { join } from "node:path";
import { mkdir, readdir, unlink } from "node:fs/promises";
import { ASSETS_DIR, LIB_DIR, STYLES_DIR, loadDocuConfig } from "./paths";
import { resolveRoutes } from "./fs-scanner";
import type { DocuRoute } from "./types";

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
}

export async function buildClientBundle(): Promise<{ js: string; css: string }> {
  await mkdir(ASSETS_DIR, { recursive: true });
  await cleanOldBundles();

  const nodeEnv = process.env.NODE_ENV || "development";
  const result = await Bun.build({
    entrypoints: [join(LIB_DIR, "client.ts")],
    outdir: ASSETS_DIR,
    naming: "client-[hash].[ext]",
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

  if (!result.success) {
    for (const log of result.logs) console.error(log);
    throw new Error("Client bundle failed");
  }

  if (!result.outputs[0]) {
    throw new Error("Client bundle produced no output files");
  }
  const jsFile = result.outputs[0].path.split("/").pop()!;
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
  const cssContent = await Bun.file(tmpCss).arrayBuffer();
  const cssHash = new Bun.CryptoHasher("md5").update(cssContent).digest("hex").slice(0, 8);
  const cssFile = `client-${cssHash}.css`;
  await Bun.write(join(ASSETS_DIR, cssFile), cssContent);
  await unlink(tmpCss);

  await Bun.write(join(ASSETS_DIR, "manifest.json"), JSON.stringify({ js: jsFile, css: cssFile }));

  return { js: jsFile, css: cssFile };
}
