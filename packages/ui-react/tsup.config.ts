import { defineConfig } from "tsup";
import fs from "node:fs";
import path from "node:path";

// Generate entry points that match package.json exports structure
const baseDir = "src/base";
const entries: Record<string, string> = {
  index: "src/index.ts",
  cn: "src/utils/cn.ts",
};

// Add base components as flat entries (e.g., input -> src/base/input.tsx)
fs.readdirSync(baseDir)
  .filter((f) => f.endsWith(".tsx"))
  .forEach((f) => {
    const name = f.replace(".tsx", "");
    entries[name] = path.join(baseDir, f);
  });

export default defineConfig({
  entry: entries,
  format: ["esm", "cjs"],
  dts: true,
  splitting: true,
  clean: true,
  external: ["react", "react-dom", "lucide-react"],
});
