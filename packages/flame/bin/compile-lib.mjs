#!/usr/bin/env node
/**
 * Precompile the Node/Deno entry points to plain ESM JavaScript in
 * `.docu/lib/`. Node cannot import `.ts`/`.tsx` sources and Deno does not
 * execute TypeScript inside npm packages, so the published package ships
 * this compiled tree alongside the Bun-executed TypeScript in `.docu/node/`.
 * The CLI routes non-Bun runtimes here (see `bin/cli.js`).
 */

import { rmSync } from "node:fs";
import { build } from "esbuild";

const ENTRIES = [
  "server.node.ts",
  "server.deno.ts",
  "build.node.ts",
  "build.deno.ts",
  "preview.node.ts",
  "preview.deno.ts",
  "deploy.node.ts",
  "deploy.deno.ts",
  "clean.ts",
];

rmSync(".docu/lib", { recursive: true, force: true });

await build({
  entryPoints: ENTRIES.map((entry) => `.docu/node/${entry}`),
  outdir: ".docu/lib",
  bundle: true,
  splitting: true,
  format: "esm",
  platform: "node",
  target: "node20",
  packages: "external",
  jsx: "automatic",
  logLevel: "info",
  plugins: [
    {
      // The SSR component graph imports `docu.json` statically
      // (client-routes.ts). At runtime that must be the USER's project
      // config, so replace the import with a cwd-relative read instead of
      // baking the monorepo's docu.json into the published bundle.
      name: "docu-config-runtime",
      setup(build) {
        build.onResolve({ filter: /docu\.json$/ }, (args) => ({
          path: args.path,
          namespace: "docu-config-runtime",
        }));
        build.onLoad({ filter: /.*/, namespace: "docu-config-runtime" }, () => ({
          contents: [
            `import { readFileSync } from "node:fs";`,
            `import { join } from "node:path";`,
            `const config = JSON.parse(readFileSync(join(process.cwd(), "docu.json"), "utf-8"));`,
            `export default config;`,
          ].join("\n"),
          loader: "js",
        }));
      },
    },
  ],
});
