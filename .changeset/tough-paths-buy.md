---
'@docubook/flame': patch
---

fix: validate PORT env var with `parseInt` and range check (1–65535)

Replace naive `Number(process.env.PORT ?? 3000)` with `parseInt(..., 10)` plus integer and range validation. Invalid values fall back to port 3000.

refactor: remove redundant `hasPlugins` check in plugin setup (server.ts + build.ts)

`builder` is already `null` when `hasPlugins` is falsy (from `hasPlugins ? new BuildPluginBuilder(docuConfig) : null`), so the extra `hasPlugins &&` guard was unnecessary in both the dev server and static build paths.
