---
'@docubook/flame': minor
---

Add Docker builder base image (`ghcr.io/docubook/flame-builder`) for zero-config Docker deployment

- New `packages/flame/docker/Dockerfile.builder` — base image with `@docubook/flame` pre-installed globally
- New `.github/workflows/docker-builder.yml` — auto-publish base image to GHCR on release
- `flame deploy --docker` now generates Dockerfile using `flame-builder:MAJOR` (e.g. `:1`) instead of building from `oven/bun`
- `flame deploy --docker` generates Dockerfile using `flame-builder:MAJOR` — simpler, no local Bun/npm needed
- `flame deploy --docker --ci` also generates `.github/workflows/deploy-docker.yml` — CI auto-builds & pushes user's site image to GHCR on `git push`
- Major version tag (`:1`) ensures patch and minor updates are automatic on redeploy
