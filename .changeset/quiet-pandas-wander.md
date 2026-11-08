---
"@docubook/flame": patch
---

Keep `flame dev` from breaking a built site. The dev server used to write its bundle into the same `_flame/` directory as `flame build`, deleting the build's hashed bundle and overwriting `manifest.json`; every static page then requested a bundle that no longer existed and no island (sidebar, table of contents, tabs, accordions, copy buttons) initialized. Under `experimental.pages` the next cached build also adopted the dev manifest, whose bundle carries no precompiled MDX modules. The dev server now leaves the build's bundles and manifest untouched, and `flame build` only reuses a `manifest.json` it wrote itself whose bundle still exists, rebundling otherwise. Dev bundles accumulate in `_flame/` until the next build cleans them. The Astro and Vercel guides for `experimental.pages` document the build order, the Turborepo monorepo setup, and why docs pages must not be served with a trailing slash.
