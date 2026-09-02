#!/usr/bin/env node
/**
 * Precompile the Node/Deno entry points to plain ESM JavaScript in
 * `.docu/lib/`. Node cannot import `.ts`/`.tsx` sources and Deno does not
 * execute TypeScript inside npm packages, so the published package ships
 * this compiled tree alongside the Bun-executed TypeScript in `.docu/node/`.
 * The CLI routes non-Bun runtimes here (see `bin/cli.js`).
 */

import { build } from "vite";

const entries = [
  "server.node",
  "server.deno",
  "build.node",
  "build.deno",
  "preview.node",
  "preview.deno",
  "deploy.node",
  "deploy.deno",
  "clean",
];

const entry = Object.fromEntries(entries.map((name) => [name, `.docu/node/${name}.ts`]));

await build({
  build: {
    outDir: ".docu/lib",
    emptyOutDir: true,
    ssr: true,
    target: "node20",
    minify: false,
    sourcemap: true,
    lib: {
      entry,
      formats: ["es"],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      // Keep npm and runtime dependencies resolvable by the target runtime.
      // Relative imports are bundled from the TypeScript source tree.
      external: (id) => !id.startsWith(".") && !id.startsWith("/") && !id.startsWith("\0"),
    },
  },
});
