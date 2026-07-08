---
"@docubook/flame": patch
---

Reduce client bundle size for Node/Deno runtimes by tree-shaking lucide-react imports.

Bun's `optimizeImports: ["lucide-react"]` tree-shakes barrel exports automatically.
esbuild lacks an equivalent, so `import * as LucideIcons` bundled all ~1000+ icon
components (~10 MB). Add an esbuild `onResolve` plugin that intercepts every
`lucide-react` import and serves a virtual module re-exporting only the icons
actually needed — automatically collected from flame's source tree and dependency
dist directories via `scanDirLucideIcons()`, plus icons referenced in the user's
`docu.json` (routes context, features, hero actions). This replaces the prior
hardcoded `SOURCE_ICONS` list that was fragile to maintain.

Also extract the `NODE_BUILTINS_RE` regex and `lucideRealEntry` resolver into
module-level constants, and use the `entryPath` variable directly instead of
recomputing `join(LIB_DIR, "client.ts")`.
