#!/usr/bin/env node
/**
 * Precompile the Node/Deno entry points to plain ESM JavaScript in
 * `.docu/lib/`. Node cannot import `.ts`/`.tsx` sources and Deno does not
 * execute TypeScript inside npm packages, so the published package ships
 * this compiled tree alongside the Bun-executed TypeScript in `.docu/node/`.
 * The CLI routes non-Bun runtimes here (see `bin/cli.js`).
 */

import { rmSync } from "node:fs";
import { build, stop } from "esbuild";

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
});

// esbuild's service process keeps Deno's event loop alive after one-shot
// build() calls — stop it explicitly so `flame` can invoke this script
// under Deno. Harmless under Node.
await stop();
