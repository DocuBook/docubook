import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: "src/index.ts",
        utils: "src/utils.ts",
        "mdx-compiler/serialize": "src/mdx-compiler/serialize.ts",
      },
      formats: ["es"],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: [
        "react",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@11ty/gray-matter",
        "@mdx-js/mdx",
        "@mdx-js/react",
        "clsx",
        "rehype-autolink-headings",
        "rehype-code-titles",
        "rehype-prism-plus",
        "rehype-slug",
        "remark-directive",
        "remark-gfm",
        "tailwind-merge",
        "unist-util-remove",
        "unist-util-visit",
        "vfile",
        "vfile-matter",
        "zod",
      ],
    },
    sourcemap: true,
    emptyOutDir: true,
  },
});
