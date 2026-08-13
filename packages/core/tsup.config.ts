import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/utils.ts",
    // Runtime MDX compilation entry (subpath @docubook/core/serialize)
    "src/mdx-compiler/serialize.ts",
  ],
  format: "esm",
  target: "node20",
  removeNodeProtocol: false,
  dts: true,
  sourcemap: true,
  clean: true,
});
