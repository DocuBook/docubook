import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/cn.ts"],
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
