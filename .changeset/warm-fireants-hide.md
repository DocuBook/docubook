---
"@docubook/themes-colors": patch
"@docubook/ui-react": patch
---

fix: bump vitest to 4.1.8 and add esbuild override for GHSA-gv7w-rqvm-qjhr

Update vitest and `@vitest/coverage-v8` to latest patch versions, and add
`esbuild` override via pnpm-workspace.yaml to resolve a high-severity
security advisory (GHSA-gv7w-rqvm-qjhr) — missing binary integrity
verification in the Deno module, patched in esbuild >=0.28.1.
