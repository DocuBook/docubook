import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/hex-to-hsl.ts", "src/resolve.ts", "src/generate-css.ts"],
      thresholds: {
        functions: 90,
        lines: 90,
        branches: 85,
      },
    },
  },
});
