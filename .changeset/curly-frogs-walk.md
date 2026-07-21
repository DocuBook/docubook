---
'@docubook/flame': patch
---

Fix Docker build: JSX runtime crash and missing git

Two issues on Coolify/Docker deployment using `oven/bun:1`:

1. **JSX runtime crash:** Bun v1.3.14 reads `NODE_ENV` at startup to select the JSX
   transform (`jsxDEV()` for dev, `jsx()` for production). Setting
   `process.env.NODE_ENV` programmatically in the CLI is too late — Bun has already
   initialized the JSX runtime. Fix: set `ENV NODE_ENV=production` in the Dockerfile
   and restore the `NODE_ENV=production` shell prefix in the project template so Bun
   sees it before startup.

2. **Git not found:** `oven/bun:1` (Alpine) does not include git, which flame needs
   for file timestamps. Fix: switch base image to `oven/bun:1-debian` (Debian-based)
   which includes git and has a more compatible glibc for native binaries like esbuild.

Changes:
- `deploy.shared.ts`: `ENV NODE_ENV=production` in Dockerfile template
- `deploy.ts`: same in DOCKERFILE_BUN template
- `deploy.shared.ts`: `oven/bun:1` → `oven/bun:1-debian`
- `deploy.ts`: `oven/bun:1` → `oven/bun:1-debian`
- `deploy.test.ts`: update assertions for `1-debian`
- `template/package.json`: restore `NODE_ENV=production` prefix on build/preview/deploy
- `bin/cli.js`: restore `NODE_ENV=production` prefix for Deno scaffold
