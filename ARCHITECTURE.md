# DocuBook — Architecture

> System architecture overview for the DocuBook monorepo. Kept intentionally
> concise and version-free — package versions live in each `package.json`.

## System Purpose

**DocuBook** is an open-source documentation platform that compiles MDX content
into production-ready documentation websites. A shared compilation pipeline
(`@docubook/core`) and portable UI components (`@docubook/mdx-content`) work
across React frameworks. The Bun-powered **flame** framework is the recommended
and actively maintained consumer — it deploys to Vercel or any static host. The
Next.js and React Router starter templates are **deprecated** and no longer
maintained (see the warning in [README.md](./README.md)).

**Scope boundaries:** content authoring and rendering only. No CMS, no user
authentication, no database. Content is file-based (`.mdx`), configuration is
declarative (`docu.json`), and deployment is CI-driven.

## Package Inventory

| Package | Path | Role |
|---------|------|------|
| `@docubook/core` | `packages/core` | MDX compilation pipeline — unified/remark/rehype plugins, frontmatter, TOC, code blocks, `createMdxContentService()` facade, git date integration. Pure TypeScript, no React dependency. |
| `@docubook/mdx-content` | `packages/mdx-content` | Portable React MDX components (Accordion, Tabs, CodeBlock, Note, Card, FileTree, Stepper, and more) with framework adapters: `./next` (Next.js image + link), `./client`, `./server`. |
| `@docubook/flame` | `packages/flame` | Bun-powered SSG framework — incremental build, plugin system, island hydration, dev server with HMR, search index. Builds the production docs site (docubook.pro). Runs on Bun, not Node.js. |
| `@docubook/ui-react` | `packages/ui/react` | Reusable DaisyUI + Tailwind CSS React component library (Collapse, Modal, Dropdown, Drawer, Navbar, Pagination, and more). Consumed by flame. Note the path: `packages/ui/react`, not `packages/ui-react`. |
| `@docubook/themes-colors` | `packages/themes-colors` | Theme color presets (default, freshlime, coffee) — CSS variables per light/dark mode plus syntax highlighting tokens. Consumed by flame via `docu.json → theme.colors`. |
| `@docubook/cli` | `packages/cli` | Node.js scaffolding CLI (Commander) — template selection, project init, package manager detection. Downloads templates from GitHub release artifacts. |
| `nextjs` template | `packages/template/nextjs` | Starter template for Vercel deployment (Next.js App Router). **Deprecated.** |
| `nextjs-docker` template | `packages/template/nextjs-docker` | Starter template for self-hosted Docker deployment (multi-stage Alpine). **Deprecated.** |
| `react-router` template | `packages/template/react-router` | React Router SSR starter (never completed — see `packages/template/react-router/plan.md`). **Deprecated.** |

### Monorepo Infrastructure

- **pnpm workspaces** — strict dependency resolution; `react`/`react-dom` and
  their types are force-pinned via `overrides` in root `pnpm-workspace.yaml`.
- **Turborepo** — orchestrates `build`, `lint`, `typecheck`, `test` with
  content-hash caching.
- **Changesets** — independent versioning per published package.
- **Husky + commitlint** — conventional commits enforced on commit and push
  (see [CONTRIBUTING.md](./CONTRIBUTING.md)).
- **GitHub Actions** — matrix CI: lint, typecheck, build, test. Bun is used
  for flame builds; pnpm with `--frozen-lockfile` everywhere else.

## Data Flow

```mermaid
flowchart LR
    A["docs/*.mdx"] --> B["@docubook/core<br/>(compile)"]
    B --> C["Framework render<br/>static HTML / SSR"]

    D["docu.json<br/>routes, theme, nav, search"] --> C

    C --> E["Flame: static output"]
    E --> F["Vercel"]
    E --> G["Any static host"]
```

### Build Pipeline

`packages/flame/.docu/node/build.ts`:

```mermaid
flowchart TD
    Start["loadPlugins()"] --> OnStart["runOnStart()"]
    OnStart --> Bundle["buildClientBundle()<br/>Bun.build + @tailwindcss/cli"]

    Bundle --> Loop["For each MDX file<br/>(concurrency: BUILD_CONCURRENCY, default 4)"]

    Loop --> Load["onLoad"]
    Load --> FM["transformFrontmatter"]
    FM --> Compile["compileMdx<br/>remark + rehype plugins"]
    Compile --> Render["renderToString"]
    Render --> Collect["collectHead / collectBody"]
    Collect --> Transform["transformHtml"]
    Transform --> Write["write HTML<br/>(per-page nonce)"]

    Write --> Next["Landing + 404 pages"]
    Next --> Search["generateSearchIndex()"]
    Search --> OnEnd["runOnEnd()"]
    OnEnd --> Cache["writeCache()"]

    Write --> Output["packages/flame/.docu/dist/"]
```

Output: landing `index.html`, `404.html`, and pages as flat `docs/<slug>.html`
files with extensionless internal links (static hosts need `cleanUrls`-style
rewriting).

## Deployment

The production docs site is built by flame and deployed to Vercel as static
output. Root `vercel.json` is the source of truth: it sets `"framework": null`
(forces the static preset), builds with `turbo build --filter=@docubook/flame...`,
serves `packages/flame/.docu/dist` with `cleanUrls`, and injects security
headers (CSP, HSTS, X-Frame-Options, and friends).

The CSP applied by the serving layer must include `script-src 'unsafe-eval'`:
flame pages hydrate MDX islands via `next-mdx-remote`, which evaluates compiled
MDX at runtime. Static HTML itself carries per-page nonces but no CSP meta tag —
CSP always comes from the serving layer (dev/preview server headers or
`vercel.json` in production).

## Key Decisions

Condensed from the retired ADRs — these commitments are still in force:

1. **Monorepo with pnpm + Turborepo + Changesets.** Strict dependency
   isolation, cached builds, independent package versioning. All contributors
   must use pnpm (pinned via `packageManager`).
2. **Shared MDX pipeline as `@docubook/core`.** One plugin chain for every
   framework — bug fixes propagate via version bump; no per-framework drift.
3. **`docu.json` as universal configuration.** Framework-agnostic JSON drives
   routes, navigation, theme, and search. Validated by
   `packages/flame/docu.schema.json` (a published artifact — editing it ships
   to npm and warrants a changeset).
4. **DaisyUI for flame, Radix UI for the (deprecated) Next.js templates.**
   DaisyUI is CSS-only — minimal JS for static output; Radix provides
   accessible primitives where a full framework runtime exists.
   `@docubook/mdx-content` stays framework-agnostic.
5. **Island hydration in flame — mixed strategy.** `createRoot` for sidebar,
   mobile bar, and MDX content (avoids hydration mismatches); `hydrateRoot` for
   stable islands (TOC, theme toggle).
6. **Theme persistence per rendering mode.** Flame sets a `dark` class on
   `documentElement` via a blocking inline script reading `localStorage`
   (prevents FOUC); Next.js templates use `next-themes`. Theme-reactive
   components must observe the class, not `matchMedia`.
7. **Incremental builds with content hashing.** SHA-256 per-file hashes in
   `build-cache.json` skip unchanged pages; asset hash changes trigger a full
   rebuild; `--force`/`--clean` for manual rebuilds.
8. **Dual Tailwind pipeline.** Flame uses `@tailwindcss/cli` (Bun has no
   PostCSS); Next.js templates use `@tailwindcss/postcss`. Both produce
   identical CSS.
9. **Flame plugin system — hook-based, zero-config.** `DocuBookPlugin`
   interface (`name` + `setup(build)`) with 10 hooks: `onStart`, `onLoad`,
   `transformFrontmatter`, `remarkPlugins`, `rehypePlugins`, `injectHead`,
   `injectBody`, `transformHtml`, `onEnd`, `handleRequest` (dev server, first
   `Response` wins). Sequential execution in registration order; no plugins
   means no behavior change. Implementation:
   `packages/flame/.docu/node/plugin.ts`.

## Testing

- Vitest per package: `cd packages/<name> && pnpm test`.
- Core tests: pure MDX compilation. mdx-content: component rendering with
  `@testing-library/react`. Flame: build pipeline, server, plugin system
  (suites in `packages/flame/.docu/__tests__/`). CLI: prompts and template
  download.
- Flame suites import `@docubook/core` — build it first:
  `npx turbo run build --filter=@docubook/core`.

## Trade-offs & Limitations

| Limitation | Impact | Mitigation |
|-----------|--------|------------|
| No dynamic content — MDX files only, no database/CMS | No user-generated content or real-time updates | Acceptable for documentation |
| Bun dependency (flame) — build step requires Bun | Limits build environments | Output is plain static HTML; only the build needs Bun |
| `unsafe-eval` in serving CSP | Weakens CSP against XSS | Required by `next-mdx-remote` island hydration; all other CSP directives stay strict |
| Single `docu.json` config — no dynamic route generation | Routes cannot come from external APIs | Covers documentation use cases |
