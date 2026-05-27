# Component Diagram

> Blocks & responsibilities of the DocuBook monorepo.

## System Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                        @docubook/monorepo                          │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────── Shared Packages ──────────────────────────┐  │
│  │                                                              │  │
│  │  ┌──────────────────┐       ┌──────────────────────────────┐ │  │
│  │  │  @docubook/core  │       │    @docubook/mdx-content     │ │  │
│  │  │                  │       │                              │ │  │
│  │  │  • MDX compile   │       │  • Portable React components │ │  │
│  │  │  • Rehype/Remark │       │  • Framework adapters        │ │  │
│  │  │  • Frontmatter   │       │    (./next, ./client,        │ │  │
│  │  │  • Code highlight│       │     ./server)                │ │  │
│  │  │  • TOC extract   │       │  • Component registry        │ │  │
│  │  └──────────────────┘       └──────────────────────────────┘ │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌─────────────────── Consumer Frameworks ───────────────────────┐ │
│  │                                                               │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐    │ │
│  │  │ @docubook/   │  │   apps/web   │  │ packages/template │    │ │
│  │  │ flame        │  │              │  │                   │    │ │
│  │  │              │  │  Production  │  │  • nextjs-vercel  │    │ │
│  │  │  Bun SSG     │  │  docs site   │  │  • nextjs-docker  │    │ │
│  │  │  DaisyUI     │  │  Next.js     │  │                   │    │ │
│  │  │  CDN deploy  │  │  Radix UI    │  │  Starter kits     │    │ │
│  │  │              │  │  Vercel      │  │  for end users    │    │ │
│  │  └──────────────┘  └──────────────┘  └───────────────────┘    │ │
│  │                                                               │ │
│  │  ┌──────────────────────────────────────────────────────────┐ │ │
│  │  │  packages/rerouter (in progress)                         │ │ │
│  │  │  Vite + React Router v7 · SSR · DaisyUI · Node server    │ │ │
│  │  └──────────────────────────────────────────────────────────┘ │ │
│  │                                                               │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌─────────────────── Tooling ───────────────────────────────────┐ │
│  │                                                               │ │
│  │  ┌──────────────┐  ┌──────────────────────────────────────┐   │ │
│  │  │ @docubook/   │  │  Monorepo Infrastructure             │   │ │
│  │  │ cli          │  │                                      │   │ │
│  │  │              │  │  • pnpm workspaces                   │   │ │
│  │  │  npx scaffold│  │  • Turborepo (cached builds)         │   │ │
│  │  │  template    │  │  • Changesets (versioning)           │   │ │
│  │  │  selection   │  │  • Husky + commitlint                │   │ │
│  │  └──────────────┘  │  • Vitest (testing)                  │   │ │
│  │                    │  • ESLint + Prettier                 │   │ │
│  │                    └──────────────────────────────────────┘   │ │
│  │                                                               │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

### Shared Packages

| Component | Responsibility | Consumers |
|-----------|---------------|-----------|
| `@docubook/core` | MDX compilation pipeline — remark/rehype plugins, frontmatter extraction, TOC generation, code block processing | All frameworks |
| `@docubook/mdx-content` | Portable MDX React components (Tabs, Accordion, CodeBlock, Note, etc.) with framework-specific adapters | All frameworks |

### Consumer Frameworks

| Component | Responsibility | Deployment |
|-----------|---------------|------------|
| `@docubook/flame` | Bun-powered SSG framework — fs-scanner, static HTML build, client-side search, island hydration | CDN (any static host) |
| `apps/web` | Production documentation site (docubook.pro) — Next.js App Router, Algolia search, Radix UI | Vercel |
| `packages/template/nextjs-vercel` | Starter template for Vercel deployment | Vercel |
| `packages/template/nextjs-docker` | Starter template for self-hosted Docker deployment | Docker/any host |
| `packages/rerouter` | React Router v7 framework mode — SSR, server-side search, cookie-based theme | Node.js server |

### Tooling

| Component | Responsibility |
|-----------|---------------|
| `@docubook/cli` | Scaffolding tool — template selection, dependency installation, project initialization |
| Turborepo | Build orchestration — task caching, parallel execution, dependency graph |
| Changesets | Package versioning — independent version management, changelog generation |
| Husky + commitlint | Git hooks — conventional commit enforcement, pre-push validation |

## Dependency Graph

```
@docubook/cli ──────────────────────────────────────────────────┐
                                                                │
                                                                ▼
                                                        templates.json
                                                                │
                                                                ▼
┌───────────────────────────────────────────────────────────────────┐
│                     Consumer Frameworks                           │
│  flame │ apps/web │ template/nextjs │ rerouter                    │
└───────────────────────────┬───────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────────┐
│                     Shared Packages                               │
│  @docubook/core  │  @docubook/mdx-content                         │
└───────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────────┐
│                     External Dependencies                         │
│  unified │ rehype │ remark │ react │ next-mdx-remote │ prism      │
└───────────────────────────────────────────────────────────────────┘
```

## Configuration Contract

All consumer frameworks share a universal configuration file:

```
docu.json
├── site metadata (title, description, logo)
├── navigation structure (routes, sections)
├── social links
├── theme settings
└── search configuration
```

This enables framework-agnostic route resolution, sidebar generation, pagination, and breadcrumb rendering.
