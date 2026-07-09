# @docubook/runt

## 0.2.0

### Minor Changes

- [#276](https://github.com/DocuBook/docubook/pull/276) [`5289e7d`](https://github.com/DocuBook/docubook/commit/5289e7d1b41359bf5405043df9cf1129631c4e20) Thanks [@pullfrog](https://github.com/apps/pullfrog)! - Multi-runtime support: flame now runs on Node.js (>=20.11) and Deno in addition to Bun.

  - New `@docubook/runt` package: `RuntimeAdapter` interface with `bunAdapter`, `nodeAdapter` (streaming `http.createServer` bridge), and `denoAdapter`.
  - flame CLI detects the runtime (`FLAME_RUNTIME` override supported) and routes `dev`/`build`/`preview`/`deploy` to Bun-native or runtime-neutral entries; existing Bun code paths are unchanged.
  - Runtime-neutral modules: pure `escapeHtml` + shared HTML shell, `child_process`-based git helpers, esbuild client bundling, and `.docu/lib` precompiled JS generated at publish for Node/Deno execution.
  - `@docubook/core`, `@docubook/mdx-content`, `@docubook/themes-colors`: dists are now bundled with tsup, producing self-contained Node-ESM-compatible output.
