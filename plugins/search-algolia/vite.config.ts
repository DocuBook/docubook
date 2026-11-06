import { readFileSync } from "node:fs";
import { builtinModules } from "node:module";
import { defineConfig } from "vite";

const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

// Server entry: the plugin flame loads from docu.json. Runs on Bun, Node and
// Deno, so it only uses node: built-ins and bundles nothing else.
export default defineConfig({
  define: { __PLUGIN_VERSION__: JSON.stringify(version) },
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: () => "index.js",
    },
    rollupOptions: {
      external: [...builtinModules, /^node:/, "@docubook/flame"],
    },
    target: "node20",
    sourcemap: true,
    emptyOutDir: false,
    minify: false,
  },
});
