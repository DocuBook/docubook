import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/utils.ts"],
  format: "esm",
  target: "node20",
  removeNodeProtocol: false,
  dts: true,
  sourcemap: true,
  clean: true,
});
