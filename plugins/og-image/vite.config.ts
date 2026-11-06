import { readFileSync } from "node:fs";
import { builtinModules } from "node:module";
import { defineConfig } from "vite";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

// Server entry: the plugin flame loads from docu.json. Runs on Bun, Node and
// Deno. Dependencies stay external: Takumi is a native module that has to be
// resolved from node_modules at runtime, never bundled.
export default defineConfig({
  define: { __PLUGIN_VERSION__: JSON.stringify(pkg.version) },
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: () => "index.js",
    },
    rollupOptions: {
      external: [
        ...builtinModules,
        /^node:/,
        "@docubook/flame",
        ...Object.keys(pkg.dependencies ?? {}).map((name) => new RegExp(`^${name}(/|$)`)),
      ],
    },
    target: "node20",
    sourcemap: true,
    emptyOutDir: false,
    minify: false,
  },
});
