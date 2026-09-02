---
"@docubook/core": patch
"@docubook/flame": patch
"@docubook/markdown": patch
"@docubook/themes-colors": patch
"@docubook/ui-react": patch
---

Migrate the DocuBook package suite to Vite 8, Rolldown, and native ESM.

### `@docubook/core`
- Switched the library build from `tsup` to Vite 8 with TypeScript declaration output.
- Preserved the existing ESM entry points and export map structure.
- Added an explicit `MDXRemote` return type to keep declaration output portable.

### `@docubook/flame`
- Switched the Node and Deno compatibility compiler in `bin/compile-lib.mjs` from `esbuild` to Vite 8 with Rolldown, keeping ESM output in `.docu/lib`.
- Kept the main runtime pipeline Bun-native and limited Vite/Rolldown to the compatibility build path.
- Updated the Vitest config to use `import.meta.dirname` for native ESM config loading.
- Fixed the plugin integration test to await its async assertion cleanly under newer Vitest behavior.

### `@docubook/markdown`
- Switched the library build from `tsup` to Vite 8 with TypeScript declaration output.
- Preserved the package's ESM-first output while aligning it with the new workspace build flow.

### `@docubook/themes-colors`
- Switched the library build from `tsup` to Vite 8 with TypeScript declaration output.
- Kept the same public API while continuing to ship native ESM output.

### `@docubook/ui-react`
- Switched the multi-entry library build from `tsup` to Vite 8 with TypeScript declaration output.
- Simplified the package to native ESM output only and removed CommonJS export conditions.
- Preserved existing component subpath entry points such as `input`, `dropdown`, `modal`, and `navbar`.
