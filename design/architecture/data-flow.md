# Data Flow

> Information movement across the DocuBook system.

## Content Pipeline

```
docs/*.mdx  ──►  @docubook/core  ──►  Compiled Output
                                       ├── MDX function body
                                       ├── Frontmatter (title, description, date)
                                       └── TOC headings (id, text, depth)
```

### Stage 1: Source → Compilation

| Input | Processor | Output |
|-------|-----------|--------|
| `.mdx` files | `parseMdxFile()` | Raw content + frontmatter |
| Raw MDX | `compileParsedMdxFile()` | Compiled MDX (remark → rehype → recma) |
| Headings | `extractTocsFromRawMdx()` | TOC array `[{id, text, depth}]` |

### Stage 2: Compilation → Rendering

| Framework | Route Resolution | Rendering Strategy |
|-----------|-----------------|-------------------|
| **flame** | `docu.json` → `fs-scanner` → route map | Static HTML via `renderToString` → CDN |
| **Next.js** | `docu.json` → `generateStaticParams` | ISR/SSG via App Router → Vercel Edge |
| **rerouter** | `docu.json` → `routes.ts` → SSR loader | Server-rendered per request → Node.js |

### Stage 3: Client Hydration

| Framework | Strategy |
|-----------|----------|
| **flame** | Island architecture — `createRoot` for MDX content only (not `hydrateRoot`) |
| **Next.js** | Full React hydration via App Router |
| **rerouter** | React Router v7 hydration (no RSC, no `"use client"`) |

## Search Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        Build Time                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  flame:     MDX files → search-indexer → static JSON            │
│  Next.js:   MDX files → Algolia crawler → DocSearch index       │
│  rerouter:  MDX files → search-indexer.server.ts → in-memory    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        Runtime                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  flame:     Client loads JSON → fuzzy match (levenshtein)       │
│  Next.js:   Client → DocSearch API → Algolia                    │
│  rerouter:  Client → useFetcher() → /api/search resource route  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Configuration Flow

```
docu.json
    │
    ├──► Route Resolution
    │       ├── Sidebar navigation tree
    │       ├── Breadcrumb path
    │       └── Previous/Next pagination
    │
    ├──► Site Metadata
    │       ├── <head> tags (title, description, OG)
    │       └── Footer / social links
    │
    └──► Theme Configuration
            ├── Color scheme (light/dark)
            └── Component variants
```

## Build Pipeline Flow

```
┌──────────┐     ┌───────────┐     ┌──────────────┐     ┌──────────┐
│  Source  │────►│ Turborepo │────►│  Per-Package │────►│  Output  │
│  Change  │     │  (cache)  │     │    Build     │     │          │
└──────────┘     └───────────┘     └──────────────┘     └──────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  Content Hash   │
              │  (skip if same) │
              └─────────────────┘
```

### Build Order (Turborepo DAG)

```
@docubook/core          (no deps)
        │
        ▼
@docubook/mdx-content   (depends on core)
        │
        ▼
flame │ apps/web │ templates │ rerouter  (depend on core + mdx-content)
```

## CLI Scaffolding Flow

```
User runs: npx @docubook/cli@latest
        │
        ▼
┌─────────────────────────────────┐
│  collectUserInput()             │
│  • Project name                 │
│  • Template selection           │
│  • Package manager preference   │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│  getOrDownloadTemplate()        │
│  • Check local cache            │
│  • Download from GitHub if miss │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│  createProject()                │
│  • Copy template files          │
│  • Install dependencies         │
│  • Display success banner       │
└─────────────────────────────────┘
```

## Theme Data Flow

| Framework | Storage | SSR Access | FOUC Prevention |
|-----------|---------|------------|-----------------|
| **flame** | `localStorage` | N/A (static) | Blocking `<script>` in `<head>` |
| **Next.js** | `localStorage` (next-themes) | N/A | `next-themes` class strategy |
| **rerouter** | Cookie | Available in loader | Cookie read during SSR |
