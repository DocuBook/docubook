---
'@docubook/flame': patch
---

Fix client-routes.ts path resolution when installed from npm

`client-routes.ts` used a static `import docuConfig from "../../docu.json"` which only
resolves correctly inside the monorepo. When the package is installed from npm, the path
resolves to `node_modules/@docubook/flame/docu.json` — a file not present in the published
package — causing `flame build` to fail with `Cannot find module '../../docu.json'`.

Changes:
- `client-routes.ts`: replace static import with `loadDocuConfig()` from `./paths` (reads
  from the project root via `process.cwd()`)
- `hydrate.ts` (Bun.build): `docu-config` plugin now intercepts `client-routes` (extensionless)
  and inlines the resolved config instead of intercepting `docu.json`
- `hydrate.node.ts` (esbuild): same plugin update for the Node/Deno bundle path
