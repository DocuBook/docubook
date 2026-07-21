---
'@docubook/flame': patch
---

fix(flame): detect package manager by lockfile in deploy.shared.ts

`detectPkgManager()` auto-detects `bun.lock`, `pnpm-lock.yaml`, `yarn.lock`,
or `package-lock.json` and returns correct Dockerfile config (base image,
install command, cache) and GHA workflow setup for each.

`generateWorkflowYml()` follows production standard:
- `actions/checkout@v7`, `actions/setup-node@v6` with `cache`
- `pnpm/action-setup@v6` for pnpm, `oven-sh/setup-bun@v2` for bun

DRY: extracted `NGINX_CONF` and `DOCKERIGNORE` to `deploy.shared.ts`,
removed duplicate from `deploy.ts`.
