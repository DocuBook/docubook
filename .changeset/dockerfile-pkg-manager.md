---
"@docubook/core": patch
"@docubook/flame": patch
"@docubook/markdown": patch
"@docubook/themes-colors": patch
"@docubook/ui-react": patch
---

Install project dependencies in generated Dockerfiles for npm, pnpm, and yarn projects

`flame deploy --docker` always generated a Dockerfile that built inside the
`ghcr.io/docubook/flame` builder image with `flame build --bun`. That image only
ships the CLI globally, so any package the docs import from the project's own
`node_modules` failed to resolve.

The generated Dockerfile is now package-manager aware. npm, pnpm, and yarn
projects get a `node:22-alpine` builder stage that copies the lockfile, installs
it (`npm ci`, `pnpm install --frozen-lockfile`, `yarn install --frozen-lockfile`),
then runs the project's `build` script. Detection is lockfile-first: a project
without a lockfile falls back to the invoking package manager
(`npm_config_user_agent`) and runs a plain install instead of the frozen one,
which would otherwise fail without a lockfile. Bun projects keep the zero-config
builder image unchanged.
