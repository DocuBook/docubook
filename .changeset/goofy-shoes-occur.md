---
"@docubook/flame": minor
---

Plugin system — 10 hooks, Bun `setup(build)` convention.

- **New**: `plugin.ts` (types), `plugin-loader.ts` (resolve & load), `plugin-builder.ts` (10 registration + 10 execution methods)
- **Modified**: `build.ts` (pipeline wiring: onStart → onLoad → transformFrontmatter → injectHead/Body → transformHtml → onEnd), `server.ts` (handleRequest), `html.ts` (head/body injection), `mdx.ts` (remark/rehype merge), `types.ts`, `docu.schema.json`
- **75 tests**: unit (39), integration (8), loader (16), mdx (6), schema (6) — zero regression

No-op when `plugins` is empty. Errors: fail-fast for build hooks, error-isolated for dev server.
