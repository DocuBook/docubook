import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    // Vitest blanks CSS imports by default; tests read the shipped stylesheet
    // via `styles.css?raw` to assert its selectors.
    css: { include: [/styles\.css/] },
  },
});
