import { defineConfig, type Options } from "tsup";

const shared: Options = {
  format: "esm",
  target: "es2020",
  dts: true,
  sourcemap: true,
};

// Directive API only — the single entry exports `createMdxComponents`.
// Bundling collapses per-file "use client" banners; the entry stays
// directive-free so it remains callable from server modules.
export default defineConfig([
  {
    ...shared,
    entry: { index: "src/index.ts" },
  },
]);
