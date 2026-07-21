---
'@docubook/flame': patch
---

Set `NODE_ENV=production` for build/preview/deploy to ensure minified client bundle

The flame CLI did not set `NODE_ENV`, so `flame build` defaulted to development
mode (no minification), producing a ~9MB client bundle instead of ~4.3MB.
Platforms like Coolify run `bun run build` without setting NODE_ENV, causing
production deployments to ship an unnecessarily large bundle.

Changes:
- `bin/cli.js`: set `process.env.NODE_ENV = "production"` for `build`, `preview`,
  and `deploy` commands when not already set
- `build.impl.ts`: pin `cspHeader()` `allowEval` to `true` regardless of NODE_ENV
  — `@docubook/mdx-remote` uses `new Function(compiledSource)` for client-side MDX
  hydration, which requires `'unsafe-eval'` in CSP until that dependency is removed
- `.env.example` (both monorepo and template): added `BUILD_CONCURRENCY`,
  `LOG_LEVEL`, `LOG_FORMAT`, `SENTRY_RELEASE` — both files now identical
