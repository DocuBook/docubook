import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/rsc.ts", "src/serialize.ts"],
  format: "esm",
  target: "node20",
  dts: true,
  sourcemap: true,
  clean: true,
});
