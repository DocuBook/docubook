# DocuBook — System Architecture Overview

## System Purpose

**DocuBook** is an open-source documentation platform that compiles MDX content into production-ready documentation websites. It solves the problem of fragmented documentation tooling by providing a shared compilation pipeline (`@docubook/core`) and portable UI components (`@docubook/mdx-content`) that work across multiple React frameworks — enabling teams to choose their preferred deployment target (static CDN, Vercel, Docker, Node.js SSR) without rewriting content or components.

**Primary users:** Developer teams and open-source maintainers who need fast, customizable documentation sites with MDX authoring.

**Scope boundaries:** Content authoring and rendering only. No CMS, no user authentication, no database. Content is file-based (`.mdx`), configuration is declarative (`docu.json`), and deployment is CI-driven.

## Component Inventory

| Name | Role | Technology | Interaction |
|------|------|-----------|-------------|
| `@docubook/core` | MDX compilation pipeline — remark/rehype plugins, frontmatter, TOC, code blocks | TypeScript, unified, remark-gfm, rehype-prism-plus | Consumed by all frameworks at build time |
| `@docubook/mdx-content` | Portable React MDX components (Tabs, Accordion, CodeBlock, Note) + framework adapters | React 19, TypeScript | Imported by frameworks; adapters for Next.js (`./next`), generic (`./client`, `./server`) |
| `@docubook/flame` | Bun-powered SSG framework — fs-scanner, static build, island hydration, client search | Bun, React, DaisyUI, Tailwind CSS 4 | Reads `docu.json`, imports core + mdx-content, outputs static HTML |
| `apps/web` | Production docs site (docubook.pro) | Next.js 16, React 19, Radix UI, Algolia DocSearch | Deployed on Vercel; imports core + mdx-content |
| `packages/template/nextjs` | Starter templates (Vercel + Docker variants) | Next.js App Router, Tailwind CSS | Distributed via CLI; imports core + mdx-content |
| `packages/rerouter` | React Router v7 SSR framework (in progress) | Vite 8, React Router v7, DaisyUI, Node.js | SSR with loaders; cookie-based theme; server-side search |
| `@docubook/cli` | Scaffolding tool — template selection, project init | Node.js, Commander, Enquirer | Downloads templates from GitHub; detects package manager |
| Turborepo | Build orchestration — caching, parallel tasks, DAG | Turborepo 2.9 | Orchestrates `build`, `lint`, `typecheck` across workspace |
| Changesets | Package versioning and changelog generation | @changesets/cli | Independent version bumps per package |
| Vitest | Unit and integration testing | Vitest 4, jsdom | Tests core plugins, mdx-content components, flame server |

## Data Flow

A representative user request — viewing a documentation page on the flame framework:

1. **Author writes** `docs/getting-started.mdx` with frontmatter and MDX components.
2. **Build triggers** — `@docubook/core` reads the file via `parseMdxFile()`, extracting frontmatter and raw content.
3. **Compilation** — `compileParsedMdxFile()` runs the unified pipeline: remark-gfm → rehype-prism-plus → rehype-code-titles → custom expandable-code plugin → recma output.
4. **Route resolution** — `fs-scanner` reads `docu.json`, maps file paths to URL slugs, generates sidebar tree, pagination links, and breadcrumb data.
5. **HTML generation** — `renderToString()` produces static HTML with the compiled MDX, wrapped in the layout shell (Navbar, Sidebar, Footer). Output written to `dist/`.
6. **Search indexing** — `search-indexer` scans all compiled MDX, extracts headings and content, writes `search-index.json` to `dist/`.
7. **CDN deployment** — Static files uploaded to CDN edge. HTML served with security headers (CSP, HSTS, X-Frame-Options).
8. **Client hydration** — Browser loads page, `client.ts` mounts interactive MDX islands via `createRoot` (not `hydrateRoot`), loads search index on demand.
9. **User searches** — Keystroke triggers fuzzy match against loaded JSON index using Levenshtein distance scoring.

**Secondary flow (Next.js):** Steps 1–3 identical. Step 4 uses `generateStaticParams`. Step 5 uses React Server Components. Step 6 uses Algolia crawler. Step 7 deploys to Vercel Edge. Step 8 uses full App Router hydration. Step 9 queries Algolia DocSearch API.

## ADR-Lite

**Decision 1: Monorepo with pnpm + Turborepo**
**Context:** Multiple packages (core, mdx-content, cli, flame, templates) share code and need coordinated releases.
**Rationale:** pnpm strict mode prevents phantom dependencies; Turborepo content-hash caching cuts CI time by 60%+; Changesets enables independent versioning.
**Trade-off:** All contributors must use pnpm (enforced via `packageManager` field). Alternatives considered: polyrepo (rejected — cross-package changes require multiple PRs), yarn workspaces (rejected — no strict dependency isolation).

**Decision 2: Shared MDX pipeline as `@docubook/core`**
**Context:** 15+ remark/rehype plugins must be configured identically across 4 frameworks.
**Rationale:** Single source of truth; bug fixes propagate via version bump; testable in isolation without framework overhead.
**Trade-off:** Frameworks cannot customize plugin chain without extending core. Alternatives considered: per-framework config (rejected — drift), shared config file (rejected — no testability).

**Decision 3: Island hydration with `createRoot` for flame**
**Context:** `hydrateRoot` caused persistent mismatches due to Bun.build CJS handling and DOM normalization differences.
**Rationale:** `createRoot` eliminates server/client diff entirely; MDX islands are small enough that full client render is acceptable.
**Trade-off:** Brief flash between static HTML and React mount; requires `unsafe-eval` in CSP. Alternatives considered: `hydrateRoot` with workarounds (rejected — 3 separate root causes), no hydration (rejected — interactive components needed).

**Decision 4: `docu.json` as universal configuration**
**Context:** Route definitions, metadata, and navigation must be shared across all frameworks.
**Rationale:** Framework-agnostic JSON is statically analyzable, safe for template distribution, and parseable by CLI tooling.
**Trade-off:** No dynamic route generation from APIs; schema must be versioned. Alternatives considered: framework-specific config (rejected — not portable), directory-based routing (rejected — insufficient metadata).

## Deployment Topology

### Environment Separation

| Environment | Purpose | Infrastructure |
|-------------|---------|---------------|
| **Development** | Local authoring + hot reload | `bun run dev` (flame), `next dev` (Next.js), `vite dev` (rerouter) |
| **CI** | Lint → Type-check → Test → Build | GitHub Actions, `pnpm --frozen-lockfile`, Turborepo remote cache |
| **Production** | Live documentation sites | CDN (flame), Vercel Edge (Next.js), Docker/Node.js (rerouter) |

### Packaging

| Framework | Build Output | Container |
|-----------|-------------|-----------|
| flame | `dist/` — static HTML, CSS, JS, search JSON | None (CDN upload) |
| Next.js (Vercel) | `.next/` — serverless functions + static assets | Vercel managed |
| Next.js (Docker) | `.next/standalone/` — self-contained Node.js server | Alpine multi-stage Docker image |
| rerouter | `build/` — server bundle + client assets | Node.js process (PM2/systemd) |

### Network Boundaries

```
┌─────────────────────────────────────────────────────────┐
│  Internet (Users)                                       │
└────────────────────────────┬────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────┐
│  CDN / Edge (Vercel, Cloudflare, etc.)                  │
│  • Static asset serving                                 │
│  • Security headers injection                           │
│  • Rate limiting                                        │
│  • TLS termination                                      │
└────────────────────────────┬────────────────────────────┘
                             │ (SSR only)
                             ▼
┌─────────────────────────────────────────────────────────┐
│  Origin Server (rerouter/Docker only)                   │
│  • Node.js process                                      │
│  • In-memory search index                               │
│  • Cookie-based theme                                   │
└─────────────────────────────────────────────────────────┘
```

### Scaling

| Target | Strategy | Limit |
|--------|----------|-------|
| flame (CDN) | Infinite horizontal — edge PoPs worldwide | Build time only |
| Vercel | Auto-scaling serverless + ISR stale-while-revalidate | Vercel plan limits |
| rerouter (Docker) | Horizontal pod scaling (stateless) | Search index memory per instance |

### Security Note

No sensitive user data is stored or processed. All content is public. Secrets (`SENTRY_DSN`, `ALGOLIA_ADMIN_KEY`) exist only in CI environment variables, never in client bundles. Supply chain hardened via pinned `packageManager`, `--frozen-lockfile`, and `pnpm audit` in CI.

## Trade-offs & Limitations

| Limitation | Impact | Mitigation |
|-----------|--------|------------|
| **No dynamic content** — all pages are MDX files, no database/CMS | Cannot support user-generated content or real-time updates | Acceptable for documentation use case; ISR provides near-real-time for Next.js |
| **Framework-specific UI** — DaisyUI (flame/rerouter) vs Radix (Next.js) | Components not directly portable between frameworks; maintenance cost × 2 | `@docubook/mdx-content` stays framework-agnostic; only layout/chrome differs |
| **In-memory search (rerouter)** — index rebuilt on startup | Memory usage grows linearly with content; cold start delay | Acceptable for <5000 pages; large sites should use Algolia |
| **`unsafe-eval` in CSP (flame preview)** — required for MDX runtime eval | Weakens CSP protection against XSS in development | Only in preview/dev mode; production static build does not require it |
| **Single `docu.json` config** — no dynamic route generation | Cannot pull routes from external APIs or databases | Covers 99% of documentation use cases; escape hatch via custom fs-scanner |
| **Bun dependency (flame)** — not all hosting providers support Bun | Limits deployment options for flame framework | Build output is standard static HTML — only build step needs Bun |
