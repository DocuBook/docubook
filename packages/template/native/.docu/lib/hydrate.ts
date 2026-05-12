import { resolve } from "node:path";
import { mkdir } from "node:fs/promises";

const ASSETS_DIR = resolve("./.docu/dist/assets");

export async function buildClientBundle() {
  await mkdir(ASSETS_DIR, { recursive: true });

  const result = await Bun.build({
    entrypoints: [resolve("./.docu/lib/client.tsx")],
    outdir: ASSETS_DIR,
    naming: "[name].[ext]",
    target: "browser",
    minify: true,
    plugins: [(await import("bun-plugin-tailwind")).default],
  });

  if (!result.success) {
    console.error("Client bundle failed:");
    for (const log of result.logs) {
      console.error(log);
    }
  }
}
