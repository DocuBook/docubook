import { readFileSync } from "node:fs";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// Same Algolia credentials as the docs: read from Flame's docu.json at build time.
const docu = JSON.parse(
  readFileSync(new URL("../packages/flame/docu.json", import.meta.url), "utf8")
);
const [, algolia] = docu.plugins.find(
  (p) => Array.isArray(p) && p[0] === "@docubook/plugin-search-algolia"
);
const askAi = typeof algolia.askAi === "string" ? { agentId: algolia.askAi } : algolia.askAi;

// shortcut: the proxy is keyed off the CLI verb, upgrade to Astro's command hook if one lands.
// In `astro dev` the docs come from Flame on :3001; `astro preview` serves them from the combined dist.
const docsProxy = { target: "http://localhost:3001", changeOrigin: true };
const isDev = process.argv.includes("dev");

export default defineConfig({
  site: docu.meta.baseURL,
  integrations: [react()],
  // One small stylesheet: inlining it drops the render-blocking request in front of the first paint.
  build: { inlineStylesheets: "always" },
  vite: {
    plugins: [tailwindcss()],
    define: {
      __ASK_AI__: JSON.stringify({ appId: algolia.appId, apiKey: algolia.apiKey, ...askAi }),
    },
    server: isDev ? { proxy: { "^/docs(?:/|$)": docsProxy, "/__hmr": docsProxy } } : {},
  },
});
