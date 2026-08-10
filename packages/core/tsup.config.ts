import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/utils.ts",
    // Runtime MDX compilation entries (were @docubook/mdx-remote subpaths)
    "src/mdx-remote/rsc.ts",
    "src/mdx-remote/serialize.ts",
  ],
  format: "esm",
  target: "node20",
  removeNodeProtocol: false,
  dts: true,
  sourcemap: true,
  clean: true,
});
