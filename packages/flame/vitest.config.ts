import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: false,
    include: [".docu/__tests__/**/*.test.ts"],
    setupFiles: [".docu/__tests__/setup.ts"],
  },
  resolve: {
    alias: {
      "@docubook/ui-react/input": path.resolve(__dirname, "../ui/react/dist/input.js"),
      "@docubook/ui-react/kbd": path.resolve(__dirname, "../ui/react/dist/kbd.js"),
      "@docubook/ui-react/modal": path.resolve(__dirname, "../ui/react/dist/modal.js"),
      "@docubook/ui-react/dropdown": path.resolve(__dirname, "../ui/react/dist/dropdown.js"),
      "@docubook/ui-react/toggle": path.resolve(__dirname, "../ui/react/dist/toggle.js"),
      "@docubook/ui-react/pagination": path.resolve(__dirname, "../ui/react/dist/pagination.js"),
      "@docubook/ui-react/theme-controller": path.resolve(
        __dirname,
        "../ui/react/dist/theme-controller.js"
      ),
      "@docubook/ui-react/breadcrumbs": path.resolve(__dirname, "../ui/react/dist/breadcrumbs.js"),
      "@docubook/ui-react/collapse": path.resolve(__dirname, "../ui/react/dist/collapse.js"),
      "@docubook/ui-react/drawer": path.resolve(__dirname, "../ui/react/dist/drawer.js"),
      "@docubook/ui-react/navbar": path.resolve(__dirname, "../ui/react/dist/navbar.js"),
    },
  },
});
