import { resolve, join } from "node:path";
import { mkdir, readdir, unlink } from "node:fs/promises";
import { $ } from "bun";

const ASSETS_DIR = resolve("./.docu/dist/assets");

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
    entrypoints: [resolve("./.docu/lib/client.ts")],
    outdir: ASSETS_DIR,
    naming: "client-[hash].[ext]",
    target: "browser",
    minify: nodeEnv === "production",
    define: { "process.env.NODE_ENV": JSON.stringify(nodeEnv) },
    plugins: [
      {
        name: "mdx-jsx-runtime",
        setup(build) {
          build.onLoad({ filter: /next-mdx-remote\/dist\/jsx-runtime\.cjs$/ }, () => {
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

  const jsFile = result.outputs[0]?.path.split("/").pop() || "client.js";
  const tmpCss = join(ASSETS_DIR, "_tmp.css");
  await $`npx @tailwindcss/cli -i .docu/styles/globals.css -o ${tmpCss} --minify`.quiet();
  const cssContent = await Bun.file(tmpCss).arrayBuffer();
  const cssHash = new Bun.CryptoHasher("md5").update(cssContent).digest("hex").slice(0, 8);
  const cssFile = `client-${cssHash}.css`;
  await Bun.write(join(ASSETS_DIR, cssFile), cssContent);
  await unlink(tmpCss);

  await Bun.write(join(ASSETS_DIR, "manifest.json"), JSON.stringify({ js: jsFile, css: cssFile }));

  return { js: jsFile, css: cssFile };
}
