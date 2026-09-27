---
"@docubook/core": patch
"@docubook/markdown": patch
"@docubook/flame": patch
---

### `@docubook/core` — fix

Fence languages Prism/refractor has no grammar for (`env`, `mdx`, `vue`, `svelte`, …) no longer abort the build. The default rehype chain registers `rehype-prism-plus` with `ignoreMissing`, so an unknown language renders as plain, unhighlighted code instead of throwing `Unknown language: …` — which previously rejected the build pre-pass and took down every page, including pages without the offending block.

### `@docubook/markdown` — fix

- Real header icons for the languages Prism does not register: `mdx`, `env`, `dotenv`, `vue`, `svelte`, `astro`, `prisma`, `jsonc`, `tf`, `terraform`, plus `hcl`. The header keeps showing the authored language name instead of falling back to the generic code icon.
- Below 640px, code blocks bleed over the content gutter (no radius, no side borders) so they span the full screen width. Hosts declare how wide that gutter is via `--docubook-content-gutter` (1rem fallback).

### `@docubook/flame` — fix

- Stylesheet-only edits now invalidate the build cache. The bundle hash folds in a stylesheet fingerprint (`cssBundleStamp()`), and the Tailwind cache key is sensitive to plain CSS and to package stylesheets imported by the entry (`@import "@docubook/markdown/styles.css"`, resolved through the project's `node_modules` layout, including pnpm's virtual store). Previously such an edit hit the bundle cache, skipped the Tailwind run and kept serving the previous CSS until `--force`. `BUILD_CACHE_VERSION` moves to v7 for the new key material.
- `--docubook-content-gutter: 1rem` added to the docs theme tokens, matching the content wrapper's `px-4` gutter.
