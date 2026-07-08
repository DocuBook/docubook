---
"@docubook/flame": patch
---

Reduce the client bundle size: enable ESM code splitting in both bundlers (Bun `hydrate.ts` and esbuild `hydrate.node.ts`) so dynamic imports like `mermaid` ship as separate on-demand chunks instead of inlining into the single entry file; select the entry output by `kind`/`entryPoint` rather than position. Restrict daisyUI to `light`/`dark` themes (via `@plugin "daisyui"`) instead of importing all ~35 built-in themes. Add immutable `Cache-Control` for hashed `/assets/*` in `vercel.json` and emit a `_headers` file from `flame deploy` for Netlify/Cloudflare Pages.