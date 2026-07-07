---
"@docubook/runt": minor
"@docubook/flame": minor
"@docubook/core": patch
"@docubook/mdx-content": patch
"@docubook/themes-colors": patch
---

Multi-runtime support: flame now runs on Node.js (>=20.11) and Deno in addition to Bun.

- New `@docubook/runt` package: `RuntimeAdapter` interface with `bunAdapter`, `nodeAdapter` (streaming `http.createServer` bridge), and `denoAdapter`.
- flame CLI detects the runtime (`FLAME_RUNTIME` override supported) and routes `dev`/`build`/`preview`/`deploy` to Bun-native or runtime-neutral entries; existing Bun code paths are unchanged.
- Runtime-neutral modules: pure `escapeHtml` + shared HTML shell, `child_process`-based git helpers, esbuild client bundling, and `.docu/lib` precompiled JS generated at publish for Node/Deno execution.
- `@docubook/core`, `@docubook/mdx-content`, `@docubook/themes-colors`: emit Node-ESM-compatible output (explicit `.js` import specifiers, JSON import attributes).
