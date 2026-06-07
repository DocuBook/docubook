# ADR-001: Monorepo with pnpm Workspaces + Turborepo

## Status

Accepted

## Context

DocuBook consists of multiple packages (core, mdx-content, cli, flame, templates) that share code and need coordinated releases. Options considered:

1. **Polyrepo** — separate repositories per package
2. **Monorepo with npm/yarn workspaces** — single repo, basic workspace support
3. **Monorepo with pnpm + Turborepo** — strict dependency resolution + cached builds

## Decision

Use pnpm workspaces for dependency management and Turborepo for build orchestration.

## Rationale

- **pnpm strict mode** prevents phantom dependencies — packages can only import what they explicitly declare
- **Turborepo caching** skips unchanged builds (content-hash based), reducing CI time significantly
- **Independent versioning** via Changesets allows packages to release on their own cadence
- **Single PR** for cross-package changes (e.g., updating a remark plugin affects core + all consumers)
- **Pinned `packageManager`** field ensures all contributors use the same pnpm version

## Consequences

- Contributors must use pnpm (enforced via `engines` + `packageManager` field)
- CI must restore Turborepo cache for speed benefits
- Cross-package type changes require rebuilding dependents (handled by Turborepo DAG)
