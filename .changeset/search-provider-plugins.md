---
"@docubook/flame": minor
---

Let a plugin replace the search dialog, and show Ask AI buttons for providers that offer it.

A plugin declares a search provider on docs pages with a `<script type="application/json" id="docubook-search-provider">` block. Its `module` path, relative to the bundle directory, is imported the first time a reader hovers, focuses or opens search. The module's default export returns `{ open(), askAi?() }`. Flame keeps its own search bar, mobile search icon and `⌘ K` shortcut, and opens the provider's UI from them. A declaration that is missing, invalid or points outside the bundle directory leaves the built-in search in place.

With `askAi: true`, flame adds a Sparkles button beside the sidebar search bar, an **Ask AI** row under the GitHub icon and theme toggle in the mobile menu drawer, and `⌘ I` / `Ctrl I`. Ask AI opens the provider's own surface, separate from the search dialog.

`DevServerContext` gains `assetsPath`, the URL path the dev server serves the bundles from (`/assets`, or `<basePath>/_flame` with `experimental.pages`). A plugin that writes files into `BuildEndContext.assetsDir` can serve the same files there during `flame dev`. The `SearchProvider`, `SearchProviderConfig` and `SearchProviderFactory` types are exported from `@docubook/flame`.

The first provider is the new `@docubook/plugin-search-algolia`, in the repository's `plugins/` directory: Algolia DocSearch v5 keyword search plus Ask AI in the DocSearch side panel.
