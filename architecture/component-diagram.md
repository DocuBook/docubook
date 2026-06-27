# Component Diagram

> Blocks & responsibilities of the DocuBook monorepo.

## System Overview

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                           @docubook/monorepo                                      │
├───────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  ┌────────────────────── Shared Packages ─────────────────────────────────────────│
│  │                                                                                │
│  │  ┌──────────────────────────┐       ┌──────────────────────────────────────┐   │
│  │  │     @docubook/core       │       │        @docubook/mdx-content         │   │
│  │  │        (v1.7.2)          │       │           (v3.2.2)                   │   │
│  │  │                          │       │                                      │   │
│  │  │  • MDX compile pipeline  │       │  • 18+ Portable React components     │   │
│  │  │  • serialize / MDXRemote │       │  • Framework adapters:               │   │
│  │  │  • Rehype/Remark plugins │       │    ./next (Next.js image+link)       │   │
│  │  │  • Frontmatter extraction│       │    ./client (generic client)         │   │
│  │  │  • Code highlighting     │       │    ./server (SSR-compatible)         │   │
│  │  │  • TOC extraction        │       │  • Component registry factory        │   │
│  │  │  • Content service       │       │  • Shared styles.css                 │   │
│  │  │    (createMdxContentSvc) │       │                                      │   │
│  │  │  • Git date integration  │       └──────────────────────────────────────┘   │
│  │  └──────────────────────────┘                                                  │
│  │                                                                                │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │  │                   @docubook/ui-react (v0.1.4)                            │  │
│  │  │                                                                          │  │
│  │  │  Reusable DaisyUI 5 + Tailwind CSS 4 React component library             │  │
│  │  │  • Collapse / Accordion       • Drawer                                   │  │
│  │  │  • Modal + useModal           • Input + InputGroup                       │  │
│  │  │  • Dropdown + Item/Link       • Kbd + FnKey.configure()                  │  │
│  │  │  • Navbar (Base, Logo, Menu)  • Pagination (docs, numbers)               │  │
│  │  │  • Toggle / ToggleGroup       • ThemeControllerToggle                    │  │
│  │  │  • Breadcrumb                 • ...                                      │  │
│  │  └──────────────────────────────────────────────────────────────────────────┘  │
│  │                                                                                │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │  │              @docubook/themes-colors (v0.10.2)                           │  │
│  │  │                                                                          │  │
│  │  │  Theme color presets + color utilities                                   │  │
│  │  │  • 3 presets: default, freshlime, coffee                                 │  │
│  │  │  • 24 CSS variables per mode (light/dark)                                │  │
│  │  │  • Syntax highlighting token colors                                      │  │
│  │  │  • Config-driven via `docu.json → theme.colors`                          │  │
│  │  └──────────────────────────────────────────────────────────────────────────┘  │
│  │                                                                                │
│  └────────────────────────────────────────────────────────────────────────────────┘
│                                                                                   │
│  ┌────────────────────── Consumer Frameworks ─────────────────────────────────────┐
│  │                                                                                │
│  │  ┌────────────────────┐  ┌────────────────────┐  ┌─────────────────────────┐   │
│  │  │   @docubook/flame  │  │     apps/web       │  │  packages/template/     │   │
│  │  │   (v1.3.5)         │  │     (v1.0.0)       │  │  nextjs (v1.0.0)        │   │
│  │  │                    │  │                    │  │  nextjs-docker          │   │
│  │  │  Bun SSG           │  │  Production site   │  │                         │   │
│  │  │  Plugin system     │  │  Next.js 16        │  │  Starter kits for       │   │
│  │  │  DaisyUI 5         │  │  Radix UI/shadcn   │  │  end users              │   │
│  │  │  CDN deploy        │  │  Algolia DocSearch │  │  Vercel / Docker        │   │
│  │  │  Island hydration  │  │  Geist font        │  │                         │   │
│  │  │  HMR via SSE       │  │  Sonner toasts     │  │                         │   │
│  │  │  Sentry (optional) │  │                    │  │                         │   │
│  │  └────────────────────┘  └────────────────────┘  └─────────────────────────┘   │
│  │                                                                                │
│  │  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │  │  packages/template/react-router (PLANNED)                                 │ │
│  │  │  Vite + React Router v6 · SSR · DaisyUI 5 · Node.js server                │ │
│  │  │  • Server-side search via resource routes (/api/search)                   │ │
│  │  │  • Cookie-based theme (SSR-safe, no FOUC)                                 │ │
│  │  │  • SPA navigation (Link/useNavigate, no full reload)                      │ │
│  │  └───────────────────────────────────────────────────────────────────────────┘ │
│  │                                                                                │
│  └────────────────────────────────────────────────────────────────────────────────┘
│                                                                                   │
│  ┌────────────────────── Tooling ───────────────────────────────────────────────┐ │
│  │                                                                              │ │
│  │  ┌────────────────┐  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │ @docubook/cli  │  │  Monorepo Infrastructure                            │ │ │
│  │  │   (v0.6.1)     │  │                                                     │ │ │
│  │  │                │  │  • pnpm workspaces (v11)                            │ │ │
│  │  │  npx docubook  │  │  • Turborepo 2.9 (content-hash caching)             │ │ │
│  │  │  template init │  │  • Changesets (independent versioning)              │ │ │
│  │  │  detect pm     │  │  • Husky 9 + commitlint (conventional commits)      │ │ │
│  │  └────────────────┘  │  • Vitest 4 (testing)                               │ │ │
│  │                      │  • ESLint 9 + Prettier 3 + perfectionist            │ │ │
│  │                      │  • GitHub Actions (matrix CI)                       │ │ │
│  │                      └─────────────────────────────────────────────────────┘ │ │
│  │                                                                              │ │
│  └──────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                   │
└───────────────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

### Shared Packages

| Component | Responsibility | Consumers |
|-----------|---------------|-----------|
| `@docubook/core` | MDX compilation pipeline — remark/rehype plugins, frontmatter extraction, TOC generation, code block processing, content service (`createMdxContentService`) | All frameworks |
| `@docubook/mdx-content` | Portable MDX React components (Accordion, Tabs, CodeBlock, Note, Card, FileTree, Image, Link, Table, Stepper, Youtube, Tooltip, Button, Release, Kbd) with framework-specific adapters | All frameworks |
| `@docubook/ui-react` | Reusable DaisyUI 5 + Tailwind CSS 4 React component library — Collapse, Modal, Dropdown, Drawer, Input, Kbd, Navbar, Pagination, Toggle, ThemeController, Breadcrumbs. Consumed by flame app components and registry. | All DaisyUI-based frameworks (flame, react-router) |
| `@docubook/themes-colors` | Theme color presets (default, freshlime, coffee) + color utilities — 24 CSS variables per mode + syntax highlighting tokens | flame (config-driven via `docu.json → theme.colors`) |

### Consumer Frameworks

| Component | Responsibility | Deployment |
|-----------|---------------|------------|
| `@docubook/flame` | Bun-powered SSG framework — fs-scanner, incremental build (content hashing + build cache + concurrency), plugin system (10 hooks), static HTML generation, client-side hydration (createRoot + hydrateRoot), hierarchy-based search index, optional Sentry error tracking, homepage sections (Hero, Features) | CDN (any static host, GitHub Pages) |
| `apps/web` | Production documentation site (docubook.pro) — Next.js App Router 16, Algolia DocSearch, Radix UI, Geist font | Vercel |
| `packages/template/nextjs` | Starter template for Vercel deployment — Next.js 16, Radix UI, framer-motion | Vercel |
| `packages/template/nextjs-docker` | Starter template for self-hosted Docker deployment | Docker/any host |
| `packages/template/react-router` | React Router v6 framework mode (planned) — SSR, server-side search, cookie-based theme | Node.js server (Vercel, Railway, VPS) |

### Tooling

| Component | Responsibility |
|-----------|---------------|
| `@docubook/cli` | Scaffolding tool — template selection (prompts-based), dependency installation, project initialization |
| Turborepo | Build orchestration — task caching, parallel execution, dependency graph |
| Changesets | Package versioning — independent version management, changelog generation |
| Husky + commitlint | Git hooks — conventional commit enforcement, pre-commit lint-staged, pre-push validation |
| GitHub Actions CI | Matrix CI — lint, typecheck, build, test on every PR/push |
| Vitest | Unit and integration testing with jsdom |
| ESLint + Prettier | Code quality — ESLint 9 flat config, perfectionist plugin, Prettier with Tailwind plugin |

## Flame Internal Architecture

```
@docubook/flame
│
├── bin/cli.js                            # CLI entry: dev, build, clean, preview, deploy, init
│
├── .docu/node/
│   ├── build.ts                          # Production build: MDX scan, compile, hash cache, HTML gen
│   ├── server.ts                         # Dev server: Bun HTTP + FileSystemRouter + HMR SSE
│   ├── client.ts                         # Browser entry: island hydration + search
│   ├── client-routes.ts                  # Route definitions from docu.json (JSON import)
│   ├── mdx.ts                            # MDX compilation using @docubook/core
│   ├── fs-scanner.ts                     # Route resolution from docu.json
│   ├── helpers.ts                        # Edit link, social links, repo URL helpers
│   ├── search-indexer.ts                 # Hierarchy-based search index generator
│   ├── search.ts                         # Client-side fuzzy search engine
│   ├── parse-tocs.ts                     # Safe TOC item parsing from MDX frontmatter
│   ├── html.ts                           # HTML shell template (theme script, nonces)
│   ├── hydrate.ts                        # Client bundle build (Bun.build + Tailwind CLI)
│   ├── preview.ts                        # Production preview server
│   ├── deploy.ts                         # Deploy to GitHub Pages (generates workflow)
│   ├── clean.ts                          # Clean build artifacts
│   ├── paths.ts                          # Path resolution for docs, dist, assets
│   ├── route.ts                          # Route utilities
│   ├── utils.ts                          # Git dates, MIME types, external URL detection
│   ├── security.ts                       # CSP headers, nonce generation, HTML response
│   ├── sentry.ts                         # Optional Sentry error tracking
│   ├── logger.ts                         # Build/dev logging
│   └── types.ts                          # Shared types (DocuConfig, DocuRoute, BuildCache)
│
├── .docu/components/
│   ├── home/                             # Homepage section components
│   │   ├── index.tsx                     # Homepage assembly (Hero + Features)
│   │   ├── Hero.tsx                      # Hero section with headline, actions, Lucide icons
│   │   └── Features.tsx                  # Feature showcase cards with grid pattern
│   ├── Lucide.tsx                        # Centralized Lucide icon wrapper (FnKey.configure())
│   ├── Navbar.tsx                        # Top navigation bar
│   ├── Sidebar.tsx                       # Sidebar navigation tree
│   ├── Menu.tsx                          # Menu/sublink items
│   ├── Footer.tsx                        # Page footer with social links
│   ├── DocsLayout.tsx                    # Docs layout (sidebar + navbar + content)
│   ├── Toc.tsx                           # Table of Contents (Intersection Observer)
│   ├── Theme.tsx                         # Theme toggle (light/dark/system)
│   ├── Search.tsx                        # Search modal UI
│   ├── Context.tsx                       # Context switcher
│   ├── Breadcrumb.tsx                    # Docs breadcrumb
│   ├── Pagination.tsx                    # Prev/next page navigation
│   ├── Anchor.tsx                        # Anchor link component
│   ├── EditWith.tsx                      # GitHub edit link
│   ├── ScrollTo.tsx                      # Scroll to top
│   ├── Typography.tsx                    # Prose wrapper
│   ├── Social.tsx                        # Social links
│   ├── Sublink.tsx                       # Sub-link component
│   └── registry.ts                       # Component registry — re-exports @docubook/ui-react base + app + MDX components
│
├── .docu/pages/
│   ├── index.tsx                         # Landing page with showcase cards
│   ├── docs/[[...slug]].tsx              # Catch-all docs page
│   └── 404.tsx                           # 404 page
│
├── .docu/styles/
│   └── globals.css                       # Tailwind + DaisyUI + custom theme (Modern Blue)
│
├── .docu/__tests__/                      # Vitest test suite
│   ├── setup.ts                          # Test setup & mocks
│   ├── build.test.ts                     # Build pipeline tests
│   ├── client.test.ts                    # Client hydration tests
│   ├── fs-scanner.test.ts                # Route scanner tests
│   ├── logger.test.ts                    # Logger tests
│   ├── search-indexer.test.ts            # Search index generation tests
│   ├── sentry.test.ts                    # Sentry integration tests
│   ├── server.test.ts                    # Dev server tests
│   └── utils.test.ts                     # Utility function tests
│
├── .docu/build-cache.json                # Incremental build cache (generated)
├── docs/                                 # MDX content directory
├── docu.json                             # Site configuration
├── docu.schema.json                      # JSON Schema for docu.json validation
└── template/                             # Scaffolding template for 'flame init'
    ├── package.json
    ├── docu.json
    ├── .env.example
    ├── gitignore
    └── docs/
        ├── index.mdx
        ├── guide/components.mdx
        └── assets/images/
```

## Flame Plugin System

Plugin system implemented at `.docu/node/plugin.ts` (interface), `.docu/node/plugin-loader.ts` (loader), and `.docu/node/plugin-builder.ts` (runner). Provides 10 hook-based integration points for the flame build pipeline and dev server.

### Plugin Interface (`DocuBookPlugin`)

| Field | Type | Purpose |
|-------|------|---------|
| `name` | `string` | Unique plugin identifier |
| `setup(build: PluginBuilder)` | `void \| Promise<void>` | Register lifecycle hooks |

| Hook | Phase | Purpose |
|------|-------|---------|
| `onStart(config)` | Build start | Setup resources, validate config |
| `onEnd(config, pages)` | Build end | Generate sitemaps, manifests |
| `onLoad({filter, namespace?}, callback)` | Per file | Transform file before MDX compile (regex-filtered, first match wins) |
| `transformFrontmatter(fm, ctx)` | Per page | Waterfall chain — mutate frontmatter before MDX compilation |
| `transformHtml(html, ctx)` | Per page | Pipeline — transform final HTML string |
| `injectHead(ctx)` | Per page | Inject HTML strings into `<head>` (collected, deduped) |
| `injectBody(ctx)` | Per page | Inject HTML strings before `</body>` (collected, deduped) |
| `remarkPlugins()` | Per page | Append remark plugins to MDX pipeline |
| `rehypePlugins()` | Per page | Append rehype plugins to MDX pipeline |
| `handleRequest(req, ctx)` | Dev server | Short-circuit request handling (first Response wins) |

### Integration Points

```
build()                              server.fetch(req)
├─ loadPlugins(config.plugins)       ├─ builder.runHandleRequest(req)
├─ builder.runOnStart(config)        │  └─ wrap plugin Response with security headers
├─ buildClientBundle()               ├─ HMR / static / router
├─ for each MDX (CONCURRENCY=4):    ├─ getDocsForSlug()
│  ├─ builder.runOnLoad()           │  └─ onLoad → transformFrontmatter →
│  ├─ builder.runTransformFm()      │     compileMdx → injectHead/Body →
│  ├─ builder.remarkPlugins()       │     transformHtml + htmlResponse(nonce)
│  ├─ builder.rehypePlugins()       └─ response
│  ├─ builder.injectHead()
│  ├─ builder.injectBody()
│  ├─ builder.transformHtml()
│  └─ builder.runOnEnd(config, pages)
├─ generateSearchIndex()
└─ writeCache()
```

### Plugin Resolution

| Pattern | Example | Resolution |
|---------|---------|------------|
| npm package | `"@docubook/plugin-sitemap"` | `import()` |
| Relative path | `"./plugins/local-reading-time"` | Resolve from project root (traversal guard) |
| Factory | `["name", {options}]` | Exported function receives options, returns `DocuBookPlugin` |
| Object | `{ name, setup }` default export | Duck-typed as `DocuBookPlugin` directly |

### Test Coverage

| File | Purpose |
|------|---------|
| `.docu/__tests__/plugin.test.ts` | Unit tests: lifecycle, error handling, dedup, type guard |
| `.docu/__tests__/plugin-integration.test.ts` | Integration tests: loading, factory, invalid plugins, fixtures |

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
│  flame │ apps/web │ template/nextjs │ template/react-router       │
└───────────────────────────┬───────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────────┐
│                     Shared Packages                               │
│  @docubook/core  │  @docubook/mdx-content                         │
│  @docubook/ui-react (DaisyUI base components)                     │
└───────────────────────────┬───────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────────┐
│                     External Dependencies                         │
│  unified │ rehype │ remark │ react 19 │ next-mdx-remote │ prism   │
│  lucide-react │ daisyui 5 │ radix-ui │ tailwindcss 4              │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                     Flame Plugin System (Implemented)             │
│                                                                   │
│  Third-party plugins loaded via docu.json "plugins" array         │
│  Hooked into build pipeline at 9 integration points               │
│  PluginRunner orchestrates sequential/waterfall execution         │
│  Zero-config default — no plugins = no behavior change            │
└───────────────────────────────────────────────────────────────────┘
```

## Configuration Contract

All consumer frameworks share a universal configuration file:

```
docu.json
├── meta: site metadata (title, description, baseURL, favicon)
├── navbar: logo text, logo image, menu items
├── footer: social links array
├── repo: GitHub config (url, path, edit flag)
├── routes: hierarchical navigation structure
│   ├── title + href
│   ├── context (icon, title, description — for landing cards)
│   └── items (nested sub-routes)
└── plugins: plugin list (planned — see Plugin System)
    ├── string: "@docubook/plugin-sitemap"
    └── [string, object]: ["@docubook/plugin-analytics", { "id": "G-XXX" }]
```

This enables framework-agnostic route resolution, sidebar generation, pagination, breadcrumb rendering, landing page showcase cards, and extensible plugin loading.

### `docu.json` `home.hero` Section (Homepage)

Homepage hero is configured under `docu.json.home.hero`:

```
docu.json
├── home:
│   ├── hero:
│   │   ├── tagline: Tagline text (optional)
│   │   ├── headline: Hero headline
│   │   ├── description: Hero description (optional)
│   │   └── actions: CTA buttons (optional)
│   │       ├── text: Button text
│   │       ├── link: Target URL
│   │       ├── theme: "primary" | "secondary" | "ghost"
│   │       └── icon: Lucide or social icon name (optional)
│   └── features: Feature showcase cards (optional)
│       ├── icon: Lucide icon name
│       ├── title: Feature title
│       ├── description: Feature description
│       └── link: Target URL (optional)
```

> **Actual types** (from `packages/flame/.docu/node/types.ts`): `Hero { tagline?, headline, description?, actions? }` with `HeroAction { text, link, theme?, icon? }`. Theme values are `"primary"` | `"secondary"` | `"ghost"` (not `"social"`). There is no `trust` section.
