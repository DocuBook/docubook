---
'@docubook/flame': patch
---

Fix client-routes.ts path resolution when installed from npm

`client-routes.ts` menggunakan static import `../../docu.json` yang hanya work di monorepo.
Saat package diinstall dari npm, path tersebut resolve ke `node_modules/@docubook/flame/docu.json`
yang tidak ada — menyebabkan `flame build` gagal dengan "Cannot find module '../../docu.json'".

Perubahan:
- `client-routes.ts`: ganti static import dengan `loadDocuConfig()` dari `./paths` (baca dari project root)
- `hydrate.ts` (Bun.build): plugin `docu-config` intercept `client-routes.ts` → inline config
- `hydrate.node.ts` (esbuild): plugin `docu-config` intercept `client-routes.ts` → inline config
