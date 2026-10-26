import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: () => "index.js",
    },
    rollupOptions: {
      // Every dependency and peerDependency must be listed here, or Rolldown
      // inlines it into dist (see the lucide-react regression fixed in #416).
      external: [
        /^react(?:\/|$)/,
        /^react-dom(?:\/|$)/,
        /^mermaid(?:\/|$)/,
        /^lucide-react(?:\/|$)/,
        /^react-icons(?:\/|$)/,
      ],
    },
    sourcemap: true,
    emptyOutDir: true,
  },
});
