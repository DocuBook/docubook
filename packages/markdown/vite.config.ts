import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: () => "index.js",
    },
    rollupOptions: {
      external: [
        /^@docubook\/core(?:\/|$)/,
        /^@mdx-js\/(?:mdx|react)(?:\/|$)/,
        /^react(?:\/|$)/,
        /^react-dom(?:\/|$)/,
        /^mermaid(?:\/|$)/,
        /^clsx(?:\/|$)/,
        /^react-icons(?:\/|$)/,
        /^rehype-autolink-headings(?:\/|$)/,
        /^rehype-code-titles(?:\/|$)/,
        /^rehype-prism-plus(?:\/|$)/,
        /^rehype-slug(?:\/|$)/,
        /^remark-directive(?:\/|$)/,
        /^remark-gfm(?:\/|$)/,
        /^tailwind-merge(?:\/|$)/,
        /^unist-util-remove(?:\/|$)/,
        /^unist-util-visit(?:\/|$)/,
        /^vfile(?:\/|$)/,
        /^vfile-matter(?:\/|$)/,
        /^zod(?:\/|$)/,
      ],
    },
    sourcemap: true,
    emptyOutDir: true,
  },
});
