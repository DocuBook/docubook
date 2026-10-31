import { defineConfig } from "vite";
import fs from "node:fs";
import path from "node:path";

const baseDir = "src/base";
const entry: Record<string, string> = {
  index: "src/index.ts",
  cn: "src/utils/cn.ts",
};

for (const file of fs.readdirSync(baseDir)) {
  if (file.endsWith(".tsx")) {
    entry[file.slice(0, -4)] = path.join(baseDir, file);
  }
}

export default defineConfig({
  build: {
    lib: {
      entry,
      formats: ["es"],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      // Rolldown warns about every "use client" even when the directive
      // survives because its module is emitted as its own file.
      checks: { moduleLevelDirective: false },
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "lucide-react",
        "clsx",
        "tailwind-merge",
      ],
    },
    sourcemap: true,
    emptyOutDir: true,
  },
});
