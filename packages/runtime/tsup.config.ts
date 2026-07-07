import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: "esm",
  target: "node18",
  removeNodeProtocol: false,
  dts: true,
  sourcemap: true,
  clean: true,
});
