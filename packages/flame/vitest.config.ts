import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    include: [".docu/__tests__/**/*.test.ts"],
    setupFiles: [".docu/__tests__/setup.ts"],
  },
});
