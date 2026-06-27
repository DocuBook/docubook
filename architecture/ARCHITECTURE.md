# DocuBook — System Architecture Overview

## System Purpose

**DocuBook** is an open-source documentation platform that compiles MDX content into production-ready documentation websites. It solves the problem of fragmented documentation tooling by providing a shared compilation pipeline (`@docubook/core`) and portable UI components (`@docubook/mdx-content`) that work across multiple React frameworks — enabling teams to choose their preferred deployment target (static CDN, Vercel, Docker, Node.js SSR) without rewriting content or components.

**Primary users:** Developer teams and open-source maintainers who need fast, customizable documentation sites with MDX authoring.

**Scope boundaries:** Content authoring and rendering only. No CMS, no user authentication, no database. Content is file-based (`.mdx`), configuration is declarative (`docu.json`), and deployment is CI-driven.

## Component Inventory

| Name | Role | Technology | Version | Interaction |
|------|------|-----------|---------|-------------|
| `@docubook/core` | MDX compilation pipeline — remark/rehype plugins, frontmatter, TOC, code blocks, content service | TypeScript, unified, remark-gfm, rehype-prism-plus | 1.7.2 | Consumed by all frameworks at build time |
| `@docubook/mdx-content` | Portable React MDX components (Tabs, Accordion, CodeBlock, Note, FileTree, Table, Stepper, Youtube, Tooltip, Release, Kbd, Card, Link, Image) + framework adapters | React 19, TypeScript | 3.2.2 | Imported by frameworks; adapters for Next.js (`./next`), generic client (`./client`), generic server (`./server`) |
| `@docubook/flame` | Bun-powered SSG framework — fs-scanner, incremental build (content hashing, build cache, concurrency), plugin system (10 hooks), island hydration (mixed createRoot/hydrateRoot), HMR via SSE, hierarchy-based search index, Sentry error tracking (optional) | Bun 1.1+, React 19, DaisyUI 5, Tailwind CSS 4, Lucide React | 1.3.5 | Reads `docu.json`, imports core + mdx-content + ui-react + themes-colors, outputs static HTML + client bundle |
| `apps/web` | Production docs site (docubook.pro) — Next.js App Router, Algolia DocSearch, Radix UI + shadcn/ui | Next.js 16, React 19.2, Geist font, Sonner | 1.0.0 | Deployed on Vercel; imports core + mdx-content |
| `packages/template/nextjs` | Starter template for Vercel deployment | Next.js 16, App Router, Tailwind CSS 4, Radix UI, framer-motion | 1.0.0 | Distributed via CLI; imports core + mdx-content |
| `packages/template/nextjs-docker` | Starter template for self-hosted Docker deployment | Next.js 16, Docker multi-stage Alpine | — | Dockerfile + template config for containerized deployment |
| `@docubook/ui-react` | Reusable DaisyUI 5 + Tailwind CSS 4 React component library — Collapse, Modal, Dropdown, Drawer, Input, Kbd, Navbar, Pagination, Toggle, ThemeController, Breadcrumbs | React 19, DaisyUI 5, Tailwind CSS 4, Lucide React | 0.1.4 | Consumed by flame app components and registry |
| `packages/template/react-router` | React Router v6 SSR framework (planned — detailed plan at `packages/template/react-router/plan.md`) | Vite, React Router v6, DaisyUI 5, Tailwind CSS 4, Node.js | — | Planned: SSR with loaders, cookie-based theme, server-side search resource routes |
| `@docubook/cli` | Scaffolding tool — template selection (via prompts), project init, dependency install | Node.js ≥18, Commander 12, prompts, tar, boxen, chalk, ora | 0.6.1 | Downloads templates from GitHub release artifacts; detects package manager |
| Turborepo | Build orchestration — content-hash caching, parallel task execution, DAG scheduling | Turborepo 2.9 | — | Orchestrates `build`, `lint`, `typecheck`, `test` across workspace |
| `@docubook/themes-colors` | Theme color presets + color utilities — 3 presets (default, freshlime, coffee) with 24 CSS variables per mode + syntax highlighting tokens | TypeScript | 0.10.2 | Consumed by flame for config-driven theme via `docu.json → theme.colors` |
| Changesets | Package versioning and changelog generation | @changesets/cli | — | Independent version bumps per package with conventional commits |
| Vitest | Unit and integration testing | Vitest 4, jsdom | — | Tests core plugins, mdx-content components, flame server, CLI |
| Husky + commitlint | Git hooks — conventional commit enforcement, pre-commit lint-staged, pre-push validation | husky 9, commitlint 21, czg | — | commit-msg, pre-commit, pre-push hooks |
| GitHub Actions CI | Matrix CI (lint, typecheck, build, test) — Bun for flame builds, pnpm for package management | ubuntu-latest, pnpm/action-setup, oven-sh/setup-bun | — | Fail-fast matrix with frozen lockfile |

## Data Flow

### Flame Content Pipeline (Build Time)

1. **Author writes** `docs/getting-started.mdx` with frontmatter and MDX components.
2. **Build triggers** — `@docubook/core` reads the file via `readMdxFileBySlug()` (with path-traversal guard), extracting frontmatter and raw content.
3. **Compilation** — `compileParsedMdxFile()` or `serialize()` runs the unified pipeline: remark-gfm → rehype-code-titles → handleCodeTitles → handleCodeExpandable → rehype-prism-plus → handleCodeExpandable (reapply) → rehype-slug → rehype-autolink-headings → postProcess → recma output.
4. **Content service** — `createMdxContentService()` provides a cached facade: `getParsedForSlug()`, `getCompiledForSlug()`, `getFrontmatterForSlug()`, `getTocsForSlug()`. Supports optional `frontmatterEnricher` for git last-modified dates.
5. **Route resolution** — `fs-scanner` reads `docu.json`, maps file paths to URL slugs, generates sidebar tree, pagination links (prev/next), and breadcrumb data.
6. **HTML generation** — Page React element rendered via `renderToString()`, wrapped in `htmlShell()` (which includes blocking theme script, security nonce, HMR script in dev). Output written to `dist/`.
7. **Search indexing** — `search-indexer` scans all MDX files, extracts hierarchy-based records (lvl0=section, lvl1=page title, lvl2-6=headings, content=paragraphs), writes `search-index.json` to `dist/assets/`.
8. **Client bundle** — `buildClientBundle()` uses `Bun.build()` with custom plugins (docu-config resolver, mdx-jsx-runtime resolver) + `@tailwindcss/cli` for CSS. Output is content-hashed (`client-[hash].js`, `client-[hash].css`).
9. **Build caching** — SHA-256 content hashing per file; `build-cache.json` skips unchanged files; `--force` / `--clean` flags for full rebuild. Concurrency controlled via `BUILD_CONCURRENCY` env (default 4).
10. **Plugin loading** — `loadPlugins()` reads `docu.json.plugins` array, resolves specifiers (npm package or relative path with traversal guard), imports default export (factory or object pattern), validates `name` + `setup()`. Plugins register lifecycle callbacks via `BuildPluginBuilder`.
11. **Plugin hooks in build** — `buildStart` (pre-build setup) → `onLoad` (file transform before MDX compile, filtered by regex) → `transformFrontmatter` (waterfall chain per page) → `remarkPlugins` + `rehypePlugins` (extend MDX pipeline) → `injectHead` + `injectBody` (collect, dedup) → `transformHtml` (final HTML pipeline) → `buildEnd` (post-build sitemaps).
12. **Security per-page** — Each page gets a unique `crypto.randomUUID()` nonce via `generateNonce()`, injected into blocking theme script, client bundle script, and CSP header.
13. **CDN deployment** — `flame deploy` runs build, adds `.nojekyll`, generates GitHub Actions workflow. Static files uploaded to CDN edge.

### Flame Dev Server

14. **Server startup** — Bun HTTP on configurable port (default 3000), `FileSystemRouter` for catch-all routes, HMR via SSE on `/__hmr`, file watcher on `docs/` for `.mdx`/`.md` changes.
15. **Plugin hooks in dev** — All content hooks active (same as build) plus `handleRequest` for custom route interception. First plugin returning `Response` short-circuits; response wrapped with security headers.
16. **Route handling** — Extracted to `server-routes.ts`: `getDocsForSlug()` with slug safety checks, `renderDocsServerPage()` with full plugin injection, `serveStatic()` with path traversal guards against `DIST_DIR` and `DOCS_DIR/assets`.

### Flame Runtime (Browser)

11. **Page loaded** — Browser requests static HTML from CDN. Blocking `<script>` in `<head>` reads localStorage for theme class before first paint (prevents FOUC).
12. **Client hydration** — `DOMContentLoaded` triggers `mountIslands()`:
    - `sidebar-island`: `createRoot` (full client render) — interactive sidebar with route tree
    - `mobile-bar-island`: `createRoot` — sticky mobile bar with drawer navigation
    - `toc-island`: `hydrateRoot` — Table of Contents with Intersection Observer
    - `theme-island`: `hydrateRoot` — Theme toggle button
    - `mdx-content-island`: `createRoot` — MDX content with `MDXRemote` + `createMdxComponents()` from `@docubook/mdx-content`
13. **User searches** — Keystroke triggers fuzzy match against loaded JSON index using Levenshtein distance scoring over hierarchy-based records.

### Secondary Flow (Next.js — apps/web & template)

Steps 1–3 identical. Step 4 uses `generateStaticParams` from docu.json routes. Step 5 uses React Server Components. Step 6 uses Algolia crawler/DocSearch. Step 7 deploys to Vercel Edge. Step 8 uses full App Router hydration. Step 9 queries Algolia DocSearch API. Additional: `@docubook/mdx-content/next` adapter provides Next.js-specific `ImageMdx` and `LinkMdx` using `next/image` and `next/link`.

## ADR-Lite

**Decision 1: Monorepo with pnpm + Turborepo**
**Context:** Multiple packages (core, mdx-content, cli, flame, templates) share code and need coordinated releases.
**Rationale:** pnpm strict mode prevents phantom dependencies; Turborepo content-hash caching cuts CI time by 60%+; Changesets enables independent versioning.
**Trade-off:** All contributors must use pnpm (enforced via `packageManager` field). Alternatives considered: polyrepo (rejected — cross-package changes require multiple PRs), yarn workspaces (rejected — no strict dependency isolation).

**Decision 2: Shared MDX pipeline as `@docubook/core`**
**Context:** remark/rehype plugins must be configured identically across 4 frameworks.
**Rationale:** Single source of truth; bug fixes propagate via version bump; testable in isolation without framework overhead.
**Trade-off:** Frameworks cannot customize plugin chain without extending core. Alternatives considered: per-framework config (rejected — drift), shared config file (rejected — no testability).

**Decision 3: Island hydration — mixed createRoot + hydrateRoot for flame**
**Context:** `hydrateRoot` caused persistent mismatches for MDX content due to Bun.build CJS handling and DOM normalization differences, but works reliably for simpler islands (TOC, theme toggle).
**Rationale:** `createRoot` for MDX content and sidebar eliminates hydration mismatch; `hydrateRoot` for TOC/theme avoids unnecessary client re-render for stable islands.
**Trade-off:** Brief flash between static HTML and React mount for MDX islands; requires `unsafe-eval` in CSP. Alternatives considered: all `hydrateRoot` (rejected — MDX mismatches), all `createRoot` (rejected — unnecessary for stable islands).

**Decision 4: `docu.json` as universal configuration**
**Context:** Route definitions, metadata, navigation, theme, and search configuration must be shared across all frameworks.
**Rationale:** Framework-agnostic JSON is statically analyzable, safe for template distribution, and parseable by CLI tooling.
**Trade-off:** No dynamic route generation from APIs; schema must be versioned (`docu.schema.json`). Alternatives considered: framework-specific config (rejected — not portable), directory-based routing (rejected — insufficient metadata).

**Decision 5: DaisyUI for SSG/SSR, Radix UI for Next.js**
**Context:** flame (SSG) needs minimal JavaScript; Next.js (ISR) benefits from rich accessible primitives.
**Rationale:** DaisyUI is pure CSS — zero JS for most components, ideal for static output; Radix provides accessible headless primitives needed in production site.
**Trade-off:** Component implementations differ between frameworks; `@docubook/mdx-content` stays framework-agnostic with vanilla React + CSS classes.

**Decision 6: Incremental build with content hashing**
**Context:** flame builds can be slow for large sites — every deploy shouldn't rebuild every page.
**Rationale:** SHA-256 content hashing + `build-cache.json` skips unchanged pages; asset hash triggers full rebuild only when JS/CSS changes; `BUILD_CONCURRENCY` parallelizes compilation (default 4).
**Trade-off:** Cache file must be managed between environments; first build is always full. See [ADR-007](./adrs/007-incremental-build-cache.md).

**Decision 7: Dual Tailwind pipeline**
**Context:** flame (Bun) has no PostCSS support; Next.js has built-in PostCSS.
**Rationale:** flame uses `@tailwindcss/cli` directly; Next.js uses `@tailwindcss/postcss`. Both produce identical CSS.
**Trade-off:** Third frameworks may need yet another pipeline (e.g., Vite uses `@tailwindcss/vite`). See [ADR-008](./adrs/008-dual-tailwind-pipeline.md).

**Decision 8: Plugin system — hook-based with zero-config default**
**Context:** Users need to extend flame (sitemaps, analytics, search, custom transforms) without forking or patching internals.
**Rationale:** Hook-based interface at 10 integration points in build + dev server covers 90%+ of extension needs. Zero-config — no plugins = no behavior change. See [ADR-009](./adrs/009-flame-plugin-system.md) and the [plugin implementation](../packages/flame/.docu/node/plugin.ts).
**Trade-off:** Plugin hooks add complexity to the build and server code paths; execution order is always sequential (no parallel hooks). Alternatives considered: (a) middleware pattern (rejected — over-engineered for <5 plugins), (b) forking (rejected — maintenance burden), (c) no extension system (rejected — users would fork anyway).
**Status:** Implemented. Plugin interface (`DocuBookPlugin`), loader (`loadPlugins()` with path traversal guard), and runner (`BuildPluginBuilder` with waterfall execution) are shipped and tested.

**Decision 9: Homepage as composable section components with `Lucide.tsx`**
**Context:** flame's landing page (`index.tsx`) was a monolithic component. Main branch introduced structured homepage sections (Hero, Features) with configurable icons and grid patterns.
**Rationale:** Separating Hero, Features, and Lucide into their own files makes the homepage composable, testable, and configurable via `docu.json`.
**Trade-off:** More files to maintain; homepage customization requires component changes for now.

**Decision 10: Centralized icon system — FnKey for keyboard shortcuts, Lucide.tsx for application icons**
**Context:** Multiple components were importing Lucide icons directly, and keyboard shortcut labels (Cmd, Option, Shift) also needed consistent rendering.
**Rationale:** Two separate systems serve different purposes:
- `FnKey.configure()` — keyboard shortcut icons (Cmd, Option, Shift, Ctrl, Enter, etc.) used in Kbd component and shortcut hints
- `Lucide.tsx` / `getLucideIcon()` — general application icons (BookOpen, Layers, Search, Zap, Paintbrush, etc.) used across Navbar, Sidebar, Search, Context, Sublink, Social, Features, and Hero
**Trade-off:** Two icon systems instead of one; `FnKey.configure()` is not for general icons.

## Deployment Topology

### Environment Separation

| Environment | Purpose | Infrastructure |
|-------------|---------|---------------|
| **Development** | Local authoring + hot reload | `bun run dev` (flame: Bun HTTP + HMR SSE), `next dev` (Next.js), `vite dev` (react-router) |
| **CI** | Lint + Type-check → Test → Build (parallel matrix) | GitHub Actions, `pnpm --frozen-lockfile`, `pnpm turbo`, Bun for flame builds |
| **Production** | Live documentation sites | CDN (flame), Vercel Edge (Next.js), Docker/Node.js (react-router) |

### Packaging

| Framework | Build Output | Container |
|-----------|-------------|-----------|
| flame | `dist/` — static HTML, CSS, JS (content-hashed), search JSON | None (CDN upload) — `flame deploy` generates GitHub Pages workflow |
| Next.js (Vercel) | `.next/` — serverless functions + static assets | Vercel managed |
| Next.js (Docker) | `.next/standalone/` — self-contained Node.js server | Alpine multi-stage Docker image |
| react-router | `build/server/` + `build/client/` — Vite bundles | Node.js process (PM2/systemd), Vercel, Railway |

### Network Boundaries

```
┌─────────────────────────────────────────────────────────┐
│  Internet (Users)                                       │
└────────────────────────────┬────────────────────────────┘
                             │ HTTPS (TLS terminated at edge)
                             ▼
┌─────────────────────────────────────────────────────────┐
│  CDN / Edge (Vercel, Cloudflare, GitHub Pages, etc.)    │
│  • Static asset serving (immutable, content-hashed)     │
│  • Security headers injection (CSP with nonces)         │
│  • Rate limiting                                        │
│  • TLS termination                                      │
└────────────────────────────┬────────────────────────────┘
                             │ (SSR only)
                             ▼
┌─────────────────────────────────────────────────────────┐
│  Origin Server (react-router/Docker only)               │
│  • Node.js process (PM2/systemd)                        │
│  • In-memory search index (built at startup)            │
│  • Cookie-based theme (SSR-safe, no FOUC)               │
│  • Resource routes: /api/search, /api/theme             │
└─────────────────────────────────────────────────────────┘

### Plugin System

Flame's plugin system provides hook-based extensibility at 10 integration points:

**Build hooks:** `onStart`, `onLoad` (filtered by regex), `transformFrontmatter` (waterfall chain), `remarkPlugins`, `rehypePlugins`, `injectHead` / `injectBody` (collect + dedup), `transformHtml` (pipeline), `onEnd`
**Dev server hooks:** `handleRequest` (short-circuit, first Response wins) + all content hooks from build

Plugin resolution: `docu.json` → `["@docubook/plugin-sitemap"]` or `["name", {options}]` → `import()` → factory/object.

Architecture: `BuildPluginBuilder` class orchestrates sequential waterfall execution. Fail-fast on errors. See the [plugin implementation](../packages/flame/.docu/node/plugin.ts).

### Homepage Components

Flame's landing page is now composed from modular sections:

| Component | File | Purpose |
|-----------|------|---------|
| `home/index.tsx` | `.docu/components/home/index.tsx` | Assembles Hero + Features into full homepage |
| `home/Hero.tsx` | `.docu/components/home/Hero.tsx` | Hero section — headline, actions (Lucide/social icons), trust indicators |
| `home/Features.tsx` | `.docu/components/home/Features.tsx` | Feature showcase cards with grid pattern background |
| `Lucide.tsx` | `.docu/components/Lucide.tsx` | Centralized Lucide icon wrapper with `FnKey.configure()` |

Homepage data is driven by `docu.json.home.hero` and route contexts — no hardcoded content.

### Scaling

| Target | Strategy | Limit |
|--------|----------|-------|
| flame (CDN) | Infinite horizontal — edge PoPs worldwide | Build time only (mitigated by incremental builds + concurrency) |
| Vercel | Auto-scaling serverless + ISR stale-while-revalidate | Vercel plan limits |
| react-router (Docker) | Horizontal pod scaling (stateless) | Search index memory per instance |

### Security Note

No sensitive user data is stored or processed. All content is public. Secrets (`SENTRY_DSN`, `ALGOLIA_ADMIN_KEY`) exist only in CI environment variables, never in client bundles. Supply chain hardened via pinned `packageManager`, `--frozen-lockfile`, `pnpm audit` in CI, and dependency `overrides` for security patches (flatted, postcss).

## Trade-offs & Limitations

| Limitation | Impact | Mitigation |
|-----------|--------|------------|
| **No dynamic content** — all pages are MDX files, no database/CMS | Cannot support user-generated content or real-time updates | Acceptable for documentation use case; ISR provides near-real-time for Next.js |
| **Framework-specific UI** — DaisyUI (flame/react-router) vs Radix (Next.js/template) | Components not directly portable between frameworks; maintenance cost × 2 | `@docubook/mdx-content` stays framework-agnostic; only layout/chrome differs |
| **In-memory search (react-router)** — index rebuilt on startup | Memory usage grows linearly with content; cold start delay | Acceptable for <5000 pages; large sites should use Algolia |
| **`unsafe-eval` in CSP (flame dev/preview)** — required for MDX runtime eval | Weakens CSP protection against XSS | Only in preview/dev mode; production static build does not require eval |
| **Single `docu.json` config** — no dynamic route generation | Cannot pull routes from external APIs or databases | Covers 99% of documentation use cases; escape hatch via custom route resolver |
| **Bun dependency (flame)** — not all hosting providers support Bun | Limits deployment options for flame framework | Build output is standard static HTML — only build step needs Bun |
| **Two Tailwind pipelines** — CLI for flame, PostCSS for Next.js | Build tooling differs across frameworks | Both produce identical CSS; theme tokens stay consistent via docu.json |
