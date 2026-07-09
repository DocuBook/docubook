---
"@docubook/flame": patch
---

Normalize esbuild importer paths before the lucide-react bypass whitelist check to prevent path-form bypass attempts.

`hydrate.node.ts` matched `args.importer` against string suffixes
(`/.docu/components/Lucide.tsx`, `/mdx-content/dist/`) without normalizing
first. Unnormalized path forms esbuild might surface (Windows backslashes,
`..`/`.` segments, redundant separators) could slip past or fail to match the
allowlist. Add a `normalizeImporterPath()` helper (`resolve()` + backslash to
forward-slash) in `security.ts` and apply it to `args.importer` before the
whitelist check.
