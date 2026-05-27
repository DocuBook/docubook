# Architecture Design

> System architecture documentation for the DocuBook monorepo.

## Consolidated Overview

- [**ARCHITECTURE.md**](./ARCHITECTURE.md) — Full system architecture overview (purpose, components, data flow, ADRs, deployment, trade-offs)

## Detailed Documents

| Document | Description |
|----------|-------------|
| [Component Diagram](./component-diagram.md) | Blocks, responsibilities, and dependency graph |
| [Data Flow](./data-flow.md) | Information movement: content pipeline, search, config, build |
| [Scalability & Reliability](./scalability-reliability.md) | Growth handling, failure modes, caching |
| [Security](./security.md) | Trust boundaries, HTTP hardening, supply chain |

## Architecture Decision Records

| ADR | Decision |
|-----|----------|
| [ADR-001](./adrs/001-monorepo-pnpm-turborepo.md) | Monorepo with pnpm + Turborepo |
| [ADR-002](./adrs/002-shared-mdx-pipeline.md) | Shared MDX compilation pipeline as package |
| [ADR-003](./adrs/003-ui-library-per-framework.md) | DaisyUI for SSG/SSR, Radix UI for Next.js |
| [ADR-004](./adrs/004-docu-json-universal-config.md) | docu.json as universal configuration |
| [ADR-005](./adrs/005-theme-persistence-strategy.md) | Theme persistence per rendering mode |
| [ADR-006](./adrs/006-flame-island-hydration.md) | Island hydration with createRoot |

## Tech Stack

- **Runtime:** Node.js ≥ 20, Bun (flame)
- **Language:** TypeScript 5.9
- **Frameworks:** Next.js 16, React Router v7, Bun HTTP server
- **UI:** React 19, Tailwind CSS 4, DaisyUI 5, Radix UI
- **Build:** Turborepo, Vite 8, Bun.build
- **Testing:** Vitest 4
- **Package Management:** pnpm 11 (workspaces)
- **Versioning:** Changesets
