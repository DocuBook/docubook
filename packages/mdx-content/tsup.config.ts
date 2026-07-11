import { defineConfig, type Options } from "tsup";

const shared: Options = {
  format: "esm",
  target: "es2020",
  dts: true,
  sourcemap: true,
  splitting: true,
};

// Bundling collapses the per-file "use client" directives, so the
// client-facing entries re-declare the boundary with a banner. The main
// entry stays directive-free: `createMdxComponents` must remain callable
// from server modules.
const useClientBanner: Options["esbuildOptions"] = (options) => {
  options.banner = { js: '"use client";' };
};

export default defineConfig([
  {
    ...shared,
    entry: { index: "src/index.ts", server: "src/server.ts" },
  },
  {
    ...shared,
    entry: { client: "src/client.ts" },
    esbuildOptions: useClientBanner,
  },
]);
