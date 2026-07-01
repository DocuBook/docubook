---
'@docubook/flame': patch
---

refactor: eliminate non-null assertions in plugin config handling

Replace `!!docuConfig.plugins?.length` + `docuConfig.plugins!` pattern with
explicit `docuConfig.plugins ?? []` default and `pluginsConfig.length > 0`
in both build.ts and server.ts. Also fix `builder?: BuildPluginBuilder` param
type to accept `null` explicitly, and replace `server.port!` with safe
`server.port ?? PORT` fallback.

- Removes unsafe non-null assertions (`!`) that could throw at runtime
- Eliminates redundant `!!` double-negation
- Keeps `const` semantics for builder variable
- Ensures consistent plugin config handling across build + dev server
