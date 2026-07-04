# Data Flow

> Information movement across the DocuBook system.

## Content Pipeline

```
docs/*.mdx  ──►  @docubook/core  ──►  Compiled Output
                                       ├── MDX function body (compiledSource)
                                       ├── React element (content)
                                       ├── Frontmatter (title, description, date)
                                       └── TOC headings (id, text, depth)
```

### Stage 1: Source → Compilation

| Input | Processor | Output |
|-------|-----------|--------|
| `.mdx` files | `readMdxFileBySlug()` — path traversal guard, index.mdx resolution | Raw MDX content + file path |
| Raw MDX | `extractFrontmatterWithContent()` (gray-matter) | Parsed frontmatter + stripped content |
| Stripped MDX | `parseMdx()` / `compileMDX()` — unified pipeline | `{ content: ReactElement, compiledSource: string, frontmatter, tocs }` |
| Combined | `createMdxContentService()` — caching facade | `getParsedForSlug`, `getCompiledForSlug`, `getFrontmatterForSlug`, `getTocsForSlug` |

### Unified Plugin Chain

```
Raw MDX → remark-gfm (tables, strikethrough, task lists)
       → handleCodeExpandableRemark (code block metadata)
       → preProcess (extract language + raw code from <pre><code>)
       → rehype-code-titles (attach code title header)
       → handleCodeTitles (mark code-title existence on <pre>)
       → handleCodeExpandable (copy expandable metadata <code>→<pre>)
       → rehype-prism-plus (syntax highlighting + line numbers)
       → handleCodeExpandable (re-apply after prism tokenization)
       → rehype-slug (add ids to headings)
       → rehype-autolink-headings (add anchor links)
       → postProcess (attach raw/language/codeTitle to <pre> props)
       → recma (MDX → JS function body)
```

### Stage 2: Compilation → Rendering

| Framework | Route Resolution | Rendering Strategy |
|-----------|-----------------|-------------------|
| **flame** | `docu.json` → `fs-scanner` → route map (prev/next, sidebar, breadcrumb) | Static HTML via `renderToString` + `htmlShell` → CDN |
| **Next.js** | `docu.json` → `generateStaticParams` | ISR/SSG via App Router → Vercel Edge |
| **react-router** | `docu.json` → `routes.ts` → SSR loader | Server-rendered per request → Node.js |

### Stage 3: Client Hydration

| Framework | Strategy |
|-----------|----------|
| **flame** | Island architecture — mixed strategy: `createRoot` for sidebar + mobile-bar + MDX content; `hydrateRoot` for TOC + theme toggle |
| **Next.js** | Full React hydration via App Router |
| **react-router** | React Router v6 hydration (no RSC, no `"use client"`) |

## Search Data Flow

### Flame — Hierarchy-Based Search Index

```
┌─────────────────────────────────────────────────────────────────┐
│                        Build Time (search-indexer.ts)           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  docs/*.mdx → scanMdxFiles() → for each file:                   │
│               1. extractFrontmatterWithContent()                │
│               2. extractRecords() — hierarchy build:            │
│                  lvl0 = section title (from docu.json routes)   │
│                  lvl1 = frontmatter title / h1                  │
│                  lvl2-lvl6 = headings h2-h6                     │
│                  content = cleaned paragraphs after headings    │
│               3. Write search-index.json → dist/assets/         │
│                                                                 │
│  Output format:                                                 │
│  { url, hierarchy: {lvl0..lvl6}, content, type }                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        Runtime (Browser)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Page load → fetch /assets/search-index.json                    │
│  User types → fuzzy match (Levenshtein distance)                │
│            → group by hierarchy level                           │
│            → navigate on click                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Next.js — Algolia DocSearch

|   Step   |                            Description                             |
| -------- | ------------------------------------------------------------------ |
| Build    | Algolia crawler scans production site, indexes page hierarchy      |
| Runtime  | Client queries Algolia DocSearch API via `@docsearch/react` widget |
| Fallback | Built-in client search as degraded fallback                        |

### React-Router — Server-Side Search (Planned)

|   Step   |                           Description                            |
| -------- | ---------------------------------------------------------------- |
| Startup  | `search-indexer.server.ts` scans all MDX, builds in-memory index |
| Request  | Client `useFetcher()` → `GET /api/search?q=...` → fuzzy match    |
| Response | JSON results → rendered in search modal                          |

## Configuration Flow

```
docu.json
    │
    ├──► Route Resolution (fs-scanner / generateStaticParams / routes.ts)
    │       ├── Sidebar navigation tree
    │       ├── Breadcrumb path
    │       └── Previous/Next pagination
    │
    ├──► Site Metadata
    │       ├── <head> tags (title, description, OG)
    │       ├── Favicon
    │       └── Footer / social links
    │
    ├──► Theme Configuration
    │       ├── Color scheme (light/dark via daisyUI / CSS variables)
    │       └── Component variants
    │
    └──► Landing Page
            ├── Showcase cards with icons (from route.context)
            └── Hero section (from meta.title + meta.description)
```

## Build Pipeline Flow

### Monorepo Build Order (Turborepo DAG)

```
@docubook/core          (no deps — pure TypeScript compilation)
        │
        ▼
@docubook/mdx-content   (depends on core as peerDependency)
        │
        ▼
flame │ templates │ react-router  (depend on core + mdx-content)
```

### Flame Incremental Build (build.ts)

```
Trigger: NODE_ENV=production bun .docu/node/build.ts
                │
                ▼
    ┌─────────────────────────────┐
    │  parseArgs()                │
    │  --force / --clean          │
    └─────────────────────────────┘
                │
                ▼
    ┌─────────────────────────────┐
    │  Read build-cache.json      │ ← content-hash map from previous build
    └─────────────────────────────┘
                │
                ▼
    ┌─────────────────────────────┐
    │  loadPlugins(config.plugins)│ ← [PLUGIN] Load enabled plugins
    └─────────────────────────────┘
                │
                ▼
    ┌─────────────────────────────┐
    │  [PLUGIN]                   │ ← builder.runOnStart()
    │  validate, init resources   │
    └─────────────────────────────┘
                │
                ▼
    ┌─────────────────────────────┐
    │  findMdxFiles(DOCS_DIR)     │ ← scan docs/ for .mdx/.md, skip assets/ and hidden
    └─────────────────────────────┘
                │
                ▼
    ┌─────────────────────────────┐
    │  buildClientBundle()        │ ← Bun.build() + @tailwindcss/cli
    │  Output: client-[hash]      │ ← content-hashed JS + CSS
    └─────────────────────────────┘
                │
                ▼
    ┌───────────────────────────────────────────────────┐
    │  For each MDX file:                               │ ← CONCURRENCY parallel (default 4)
    │   shouldRebuild(path, mtime, cache)?               │ ← check cache by path + mtime + content hash
    │   [PLUGIN] builder.runOnLoad(filePath, content)      │ ← regex-filtered file transform
    │   [PLUGIN] builder.transformFrontmatter()          │ ← waterfall chain
    │   compileMdx() with merged remark/rehype plugins  │ ← [PLUGIN] remarkPlugins() + rehypePlugins()
    │   renderToString()                                │ ← React SSR
    │   [PLUGIN] builder.collectHead() + collectBody()   │ ← inject into htmlShell (deduped)
    │   [PLUGIN] builder.transformHtml()                 │ ← final HTML pipeline
    │   writeFile() with unique nonce per page           │ ← generateNonce() per page
    │   update cache (SHA-256 hash)                      │ ← update build-cache.json
    └───────────────────────────────────────────────────┘
                │
                ▼
    ┌─────────────────────────────┐
    │  Index page (/) + 404 page  │ ← with unique nonce
    └─────────────────────────────┘
                │
                ▼
    ┌─────────────────────────────┐
    │  generateSearchIndex()      │ ← hierarchy-based search-index.json
    └─────────────────────────────┘
                │
                ▼
    ┌─────────────────────────────┐
    │  [PLUGIN]                   │ ← builder.runOnEnd(pages)
    │  sitemaps, reports, etc.    │
    └─────────────────────────────┘
                │
                ▼
    ┌─────────────────────────────┐
    │  writeCache()               │ ← persist build-cache.json
    │  exit(1) if any errors      │ ← any page error = build failure
    └─────────────────────────────┘
```

**Plugin lifecycle in build:** 10 integration points via `BuildPluginBuilder`. Zero-config — no plugins = no behavior change. See the [plugin implementation](../packages/flame/.docu/node/plugin.ts).

### Flame Dev Server (server.ts)

```
Trigger: bun .docu/node/server.ts
                │
                ▼
    ┌─────────────────────────────────────┐
    │  loadPlugins(config.plugins)        │ ← [PLUGIN] Load enabled plugins
    │  buildClientBundle()                │
    │  generateSearchIndex()              │
    │  Bun.FileSystemRouter(PAGES_DIR)    │ ← catch-all routes
    │  Bun.serve({ port: 3000 })          │ ← HTTP server
    │  watch(DOCS_DIR, recursive)         │ ← HMR via SSE
    └─────────────────────────────────────┘
                │
                ▼
         ┌───────────┐
         │  Request  │
         └─────┬─────┘
               │
        ┌──────┴──────────────────────────────┐
        ▼                                      ▼
   [PLUGIN] builder.runHandleRequest(req)  If Response → wrap with security headers
   (first Response wins)                  (plugin headers preserved + missing security headers added)
        │                                      │
        └──────────┬───────────────────────────┘
                   │
            ┌──────┴──────┐
            ▼              ▼
       Static file     Router match
       (assets/*,          │
        .ext files)        ├── /docs/[[...slug]] → getDocsForSlug() → compileMdx() → renderToString()
                           ├── / → IndexPage
                           └── 404 → NotFoundPage
                    │
                    ▼
             ┌───────────┐
             │  Response │← htmlShell() with nonce-based CSP + HMR script
             │           │  [PLUGIN] collectHead() + collectBody() + transformHtml()
             └───────────┘
```

**Plugin hooks in dev server:** Same content hooks as build (`onLoad`, `transformFrontmatter`, `remarkPlugins`, `rehypePlugins`, `injectHead`, `injectBody`, `transformHtml`), plus `handleRequest` for custom routes/middleware. Routes extracted to `server-routes.ts`: `getDocsForSlug()` with slug safety checks, `renderDocsServerPage()` with full plugin injection, `serveStatic()` with path traversal guards against `DIST_DIR` and `DOCS_DIR/assets`.

## CLI Scaffolding Flow

```
User runs: npx @docubook/cli@latest (or: npx @docubook/flame init)
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
│    (tar extraction)             │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│  createProject()                │
│  • Copy template files          │
│  • Install dependencies         │
│  • Rename gitignore             │
│  • Display success banner       │
└─────────────────────────────────┘
```

## Theme Data Flow

|  Framework   |             Storage              |     SSR Access      |                               FOUC Prevention                                |
| ------------ | -------------------------------- | ------------------- | ---------------------------------------------------------------------------- |
| **flame**    | `localStorage`                   | N/A (static)        | Blocking `<script>` in `<head>` reads localStorage, sets class before render |
| **Next.js**  | `localStorage` via `next-themes` | N/A                 | `next-themes` class strategy + system preference detection                   |
| **react-router** | Cookie                           | Available in loader | Cookie read during SSR — renders correct theme immediately                   |

## Git Date Integration

```
Build Time (flame build.ts):
  1. findMdxFiles() → collect all MDX file paths
  2. getGitLastModifiedBatch(paths) → single git log spawn for all files
  3. Pass gitDates Map to compileMdx()
  4. compileMdx() → frontmatter.date || gitDates.get(filePath) || getGitLastModified(filePath)
  5. Date displayed as "Last updated {date}" in docs page

Next.js:
  Uses frontmatterEnricher in createMdxContentService() → reads git date per file
```
