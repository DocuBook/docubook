import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      // Rolldown warns about every "use client" even when the directive
      // survives because its module is emitted as its own file.
      checks: { moduleLevelDirective: false },
      // Every dependency and peerDependency must be listed here, or Rolldown
      // inlines it into dist (see the lucide-react regression fixed in #416).
      external: [
        /^react(?:\/|$)/,
        /^react-dom(?:\/|$)/,
        /^mermaid(?:\/|$)/,
        /^lucide-react(?:\/|$)/,
        /^react-icons(?:\/|$)/,
      ],
      // Keep one output file per source module so each component keeps its
      // "use client" directive; a single bundle would drop it.
      output: {
        preserveModules: true,
        preserveModulesRoot: "src",
      },
    },
    sourcemap: true,
    emptyOutDir: true,
  },
});
