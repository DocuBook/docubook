---
'@docubook/flame': patch
---

Set NODE_ENV=production for build/preview/deploy to ensure minified client bundle

The flame CLI did not set `NODE_ENV`, so `flame build` defaulted to development
mode (no minification), producing a ~9MB client bundle instead of ~4.3MB.
Platforms like Coolify run `bun run build` without setting NODE_ENV, causing
production deployments to ship an unnecessarily large bundle.

Changes:
- `bin/cli.js`: set `process.env.NODE_ENV = "production"` for build, preview,
  and deploy commands when not already set
- `template/package.json`: add `NODE_ENV=production` prefix to build/preview/deploy
  scripts as defense in depth
- `bin/cli.js` Deno init: same prefix for Deno scaffolded projects
