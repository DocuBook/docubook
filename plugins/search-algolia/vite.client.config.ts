import { defineConfig } from "vite";

// Browser entry: copied beside flame's bundles and imported on first use.
// DocSearch is bundled in; its two surfaces stay separate chunks so the Ask
// AI panel only downloads when the reader opens it.
export default defineConfig({
  build: {
    outDir: "dist/client",
    lib: {
      entry: "src/client/index.ts",
      formats: ["es"],
      fileName: () => "client.js",
      cssFileName: "style",
    },
    rollupOptions: {
      output: {
        chunkFileNames: "chunks/[name]-[hash].js",
      },
    },
    target: "es2022",
    sourcemap: false,
    emptyOutDir: true,
  },
});
