# Architecture Design

> System architecture documentation for the DocuBook monorepo.

## Consolidated Overview

- [**ARCHITECTURE.md**](./ARCHITECTURE.md) — Full system architecture overview (purpose, components, data flow, ADRs, deployment, trade-offs)

## Detailed Documents

| Document | Description | Key Updates |
|----------|-------------|-------------|
| [Component Diagram](./component-diagram.md) | Blocks, responsibilities, and dependency graph — including flame internal architecture | Updated versions (flame 1.3.5, core 1.7.2, mdx-content 3.2.2, ui-react 0.1.4), added themes-colors package, plugin system implemented |
| [Data Flow](./data-flow.md) | Information movement: content pipeline, search, config, build, theme, git integration | Updated plugin hooks to 10 (added onLoad), concurrency default 4, per-page nonce, routes extracted to server-routes.ts |
| [Scalability & Reliability](./scalability-reliability.md) | Growth handling, failure modes, caching | Updated concurrency default from 10 to 4, plugin hooks from 9 to 10 |
| [Security](./security.md) | Trust boundaries, HTTP hardening, supply chain | Plugin system implemented with 8 security rules, sanitization warnings, handleRequest header wrapping, realpathSync for symlink guards |

## Architecture Decision Records

| ADR | Decision |
|-----|----------|
| [ADR-001](./adrs/001-monorepo-pnpm-turborepo.md) | Monorepo with pnpm + Turborepo |
| [ADR-002](./adrs/002-shared-mdx-pipeline.md) | Shared MDX compilation pipeline as package |
| [ADR-003](./adrs/003-ui-library-per-framework.md) | DaisyUI for SSG/SSR, Radix UI for Next.js |
| [ADR-004](./adrs/004-docu-json-universal-config.md) | docu.json as universal configuration |
| [ADR-005](./adrs/005-theme-persistence-strategy.md) | Theme persistence per rendering mode |
| [ADR-006](./adrs/006-flame-island-hydration.md) | Island hydration — mixed createRoot (sidebar, MDX) + hydrateRoot (TOC, theme) |
| [ADR-007](./adrs/007-incremental-build-cache.md) | Incremental build with SHA-256 content hashing and build-cache.json |
| [ADR-008](./adrs/008-dual-tailwind-pipeline.md) | Dual Tailwind CSS pipeline — CLI for flame, PostCSS for Next.js |
| [ADR-009](./adrs/009-flame-plugin-system.md) | Flame plugin system — hook-based extensibility at 10 integration points |

## Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| **Runtime** | Node.js, Bun (flame only) | ≥20.0.0, ≥1.1.0 |
| **Language** | TypeScript, JavaScript (CLI) | TS 5.9 |
| **Frameworks** | Next.js (apps/web + template), React Router v6 (react-router — planned), Bun HTTP (flame dev) | Next 16, RRv6 |
| **UI** | React, Tailwind CSS, DaisyUI (flame/react-router), Radix UI (Next.js), framer-motion (template), Lucide React | React 19, TW 4, DaisyUI 5 |
| **Build** | Turborepo, Vite (react-router), Bun.build (flame), tsc (core/mdx-content) | Turbo 2.9 |
| **Testing** | Vitest, jsdom, @testing-library/react | Vitest 4 |
| **Package Management** | pnpm workspaces | pnpm 11 |
| **Versioning** | Changesets | — |
| **CI** | GitHub Actions matrix (lint, typecheck, build, test) | — |
| **Quality** | ESLint 9 flat config, Prettier 3, Husky 9, commitlint, lint-staged | — |
