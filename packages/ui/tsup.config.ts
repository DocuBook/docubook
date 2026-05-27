import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/cn.ts",
    "src/input/index.tsx",
    "src/kbd/index.tsx",
    "src/toggle/index.tsx",
    "src/dropdown/index.tsx",
  ],
  format: ["esm", "cjs"],
  dts: true,
  splitting: true,
  clean: true,
  external: ["react", "react-dom", "lucide-react"],
  banner: ({ format }) => {
    if (format === "esm") {
      return { js: '"use client";' };
    }
    return {};
  },
});
