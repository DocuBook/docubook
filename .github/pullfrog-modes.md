# Pullfrog Modes — DocuBook Monorepo

Instructions for Pullfrog custom modes. Copy-paste each mode's content into
the [Pullfrog console → Modes card](https://console.pullfrog.com) per mode field.

---

## Build

**Description:** Implement features, fix bugs, or make code changes in the DocuBook monorepo. Used for: new features, bug fixes, dependency upgrades, refactors, tests, CI changes.

**Instructions:**

You are working on the DocuBook monorepo. Follow these guidelines:

### Architecture

- **Monorepo**: pnpm workspaces, Turborepo (build/lint/typecheck/test orchestration), Changesets (versioning).
- **Packages**: `packages/core` (MDX compile), `packages/mdx-content` (React MDX components + framework adapters), `packages/flame` (Bun SSG), `packages/cli` (scaffolding), `packages/ui/react` (DaisyUI components), `packages/themes-colors` (theme presets).
- **Production site**: `packages/flame` builds the docs site (docubook.pro), deployed to Vercel as static output.

### Key Constraints

- **No new dependencies** if stdlib or existing dep suffices. flame uses Bun stdlib (no Express/koa). CLI uses Commander 12.
- **React 19.2** — all packages must stay compatible. Overrides in root `pnpm-workspace.yaml`.
- **TypeScript** — strict mode. Tests use Vitest 4 + jsdom.
- **Lint**: ESLint 9 flat config + perfectionist. Prettier 3 + Tailwind plugin. Husky 9 + commitlint enforce conventional commits.
- **CI**: GitHub Actions matrix (lint, typecheck, build, test). `pnpm --frozen-lockfile`. Bun for flame builds.

### Packages Detail

#### @docubook/core
Pure TypeScript — MDX compilation pipeline (unified, remark-gfm, rehype-prism-plus).
`createMdxContentService()` facade: `getParsedForSlug()`, `getCompiledForSlug()`,
`getFrontmatterForSlug()`, `getTocsForSlug()`. Git date integration.
No React dependency. Tests: Vitest.

#### @docubook/mdx-content
18+ Portable React components: Accordion, Tabs, CodeBlock, Note, Card, FileTree,
Image, Link, Table, Stepper, Youtube, Tooltip, Button, Release, Kbd.
Framework adapters: `./next` (Next.js image+link), `./client`, `./server`.
Uses `createComponentsRegistry()` for dynamic component resolution.
Tests: Vitest + @testing-library/react.

#### @docubook/flame
Bun SSG — NOT Node.js. Uses `Bun.build()`, `Bun.write()`, `Bun.serve()`, `Bun.FileSystemRouter`.
Plugin system: 10 hooks via `DocuBookPlugin` interface (`setup(build: PluginBuilder)`).
Hooks: `onStart`, `onLoad` (regex-filtered file transform), `transformFrontmatter` (waterfall),
`remarkPlugins`, `rehypePlugins`, `injectHead`, `injectBody` (collect + dedup),
`transformHtml` (pipeline), `onEnd`, `handleRequest` (dev server, first Response wins).
Island hydration: `createRoot` for sidebar/mobile-bar/MDX content, `hydrateRoot` for TOC/theme.
Security: CSP nonce per-page (`crypto.randomUUID()`), `isPathSafe()`/`isSlugSafe()` with `realpathSync` symlink guards.
Build: incremental (SHA-256 content hashing), concurrency `BUILD_CONCURRENCY` (default 4), build-cache.json.
Tailwind: uses `@tailwindcss/cli` (NOT PostCSS).
Homepage: composable Hero + Features sections driven by `docu.json.home.hero`.
Icon system: `FnKey.configure()` for keyboard shortcuts, `Lucide.tsx` for app icons.
Sentry: optional via `@sentry/bun` peer dep (opt-in).
Dev server: HMR via SSE on `/__hmr`, file watcher on `docs/` for `.mdx`/`.md`.

#### @docubook/ui-react
DaisyUI 5 + Tailwind CSS 4 components: Collapse, Modal, Dropdown, Drawer, Input, Kbd,
Navbar, Pagination, Toggle, ThemeController, Breadcrumbs.
Bundled with tsup → CJS + ESM. Tests: Vitest + jsdom.

#### @docubook/themes-colors
Theme presets: default (blue, ~210° hue), freshlime (~85°), coffee (~25-35°).
24 CSS variables per mode (light + dark) + syntax highlighting tokens.
Consumed by flame via `docu.json → theme.colors`.

#### @docubook/cli
Node.js CLI (Commander 12). Scaffolds projects from template artifacts on GitHub.
Package manager auto-detection. Prompt-based template selection.

### Data Flow

```
docs/*.mdx → @docubook/core (compile) → Framework render → Static HTML / SSR
                                                  ↓
                                      docu.json → routes, theme, nav, search
                                                  ↓
                                      flame: CDN static · Next.js: Vercel ISR
```

Build pipeline (flame):
1. loadPlugins() → runOnStart()
2. buildClientBundle() (Bun.build + @tailwindcss/cli)
3. For each MDX (concurrency 4):
   onLoad → transformFrontmatter → compileMdx (remark + rehype plugins)
   → renderToString → collectHead/Body → transformHtml → writeFile(nonce)
4. landing + 404 pages → generateSearchIndex() → runOnEnd() → writeCache()

### Testing

- `vitest run` per package. Core tests: pure MDX compilation. mdx-content tests: component rendering with @testing-library/react. flame tests: build pipeline, server, plugin system. CLI tests: prompt handling, template download.
- Run tests in the package directory: `cd packages/{name} && pnpm test`

### Build & CI

- Root: `pnpm build` runs `turbo build` (cached, content-hash-based).
- flame builds need Bun: `cd packages/flame && NODE_ENV=production bun .docu/node/build.ts`
- CI: GitHub Actions matrix — lint (all), typecheck (all), build (all), test (all).
- All must pass before merge. Conventional commits enforced via commitlint.

---

## Review

**Description:** Review PRs, code changes, or implementations in the DocuBook monorepo. Focus on: correctness, architectural alignment, security, performance, testing.

**Instructions:**

You are reviewing a PR / code change in the DocuBook monorepo. Evaluate against these criteria:

### Architectural Alignment

1. **Package boundaries**: Does the change belong in the right package?
   - MDX compilation → `@docubook/core`
   - MDX React components → `@docubook/mdx-content`
   - SSG/build/dev server → `@docubook/flame` (Bun-only)
   - DaisyUI components → `@docubook/ui-react`
   - Theme/color utilities → `@docubook/themes-colors`
   - CLI/tooling → `@docubook/cli`
   - Template/Adapters → respective template packages

2. **Framework coupling**: flame code must NOT depend on Next.js or vice versa.
   `@docubook/mdx-content` adapter (`./next`) is the only cross-framework bridge.

3. **Shared MDX pipeline**: If adding remark/rehype plugins, add them to `@docubook/core`
   or via flame plugin system (`rehypePlugins`/`remarkPlugins` hooks), not per-framework.

### Security Checklist

- CSP: Any new script injection must use nonce (not inline without nonce).
- `unsafe-eval` only in dev/preview mode — never in production static build.
- Path traversal: Use `isPathSafe()` / `isSlugSafe()` from `security.ts` for any file read.
- Plugin `injectHead`/`injectBody`: sanitize user-controlled data; runtime type guard logs on non-string returns.
- Plugin `handleRequest`: response must go through security header wrapping (missing SECURITY_HEADERS added automatically in server.ts).
- New dependencies: must go through `pnpm-workspace.yaml` overrides review (CVE patches).

### Flame Plugin System

- Plugins use `DocuBookPlugin { name, setup(build) }` convention (like Bun plugins).
- Hook execution order = registration order. Sequential, no parallel.
- Error handling is mixed: lifecycle hooks (`onStart`/`onEnd`/`onLoad`/`handleRequest`/`transform*`) catch-and-continue; collection hooks (`injectHead`/`injectBody`/`remarkPlugins`/`rehypePlugins`) throw with `cause` wrapping.
- `handleRequest`: first Response wins, wrapped with security headers.
- `onLoad`: first matching `filter` regex wins.
- `injectHead`/`injectBody`: deduplicated via `[...new Set(items)]`.

### Testing Expectations

- New features: add Vitest tests in the relevant package's `__tests__/` dir.
- flame plugin changes: add tests in `packages/flame/.docu/__tests__/`.
- MDX component changes: add tests in `packages/mdx-content/src/__test__/`.
- Core pipeline changes: add tests in `packages/core/src/__tests__/`.
- Bug fixes: add a test that would have caught the regression.
- All existing tests must pass: `pnpm test` (or `turbo test`).

### Performance

- flame build: concurrency-based (BUILD_CONCURRENCY default 4). New I/O work should use concurrency batching, not sequential awaits.
- No synchronous file system calls in hot paths (MDX compilation, page rendering).
- Content hashing (SHA-256) for incremental builds — skip recompilation when content unchanged.
- Asset hash comparison (`__assets__` cache key) to detect client bundle changes.

### Common Pitfalls

- **Bun vs Node.js**: flame runs on Bun. No `node:fs` sync methods in hot paths. `import.meta.dirname` for directory resolution. Bun.file() for file reads.
- **React 19**: All packages use React 19.2. No deprecated lifecycle methods.
- **Tailwind CSS 4**: flame uses `@tailwindcss/cli` CLI, NOT PostCSS plugin. Next.js uses `@tailwindcss/postcss`. Dual pipeline is intentional.
- **Conventional commits**: enforced by commitlint + husky. Format: `type(scope): message`.
- **Changesets**: package version bumps via `@changesets/cli`, not manual package.json edits.

---

## Plan

**Description:** Create structured plans for new features, refactors, or architectural changes in the DocuBook monorepo. Break down complex work into clear milestones.

**Instructions:**

You are planning work in the DocuBook monorepo. Follow this structure:

### 1. Problem & Scope

- What specific problem is being solved? (Not the solution, the problem.)
- Which user or developer workflow does this affect?
- Boundaries: what is explicitly IN and OUT of scope.

### 2. Package Impact Analysis

For each affected package, determine:
- Does it need new exports? Modified types? Breaking changes?
- Does it introduce new dependencies? (Prefer stdlib/existing.)
- Does it affect the plugin system? (New hooks? Changed interface?)

| Change Type | Primary Package | Secondary |
|---|---|---|
| New MDX component | `@docubook/mdx-content` | flame (registry) |
| New DaisyUI component | `@docubook/ui-react` | flame (registry.ts) |
| Build pipeline change | `@docubook/flame` (.docu/node/) | — |
| Config schema change | `@docubook/flame` (types.ts) | cli, docu.schema.json |
| Plugin hook addition | `@docubook/flame` (plugin.ts) | plugin-builder, build, server |
| New theme | `@docubook/themes-colors` | flame (theme resolution) |
| API / adapter | `@docubook/mdx-content/adapters` | template packages |

### 3. Key Decisions (ADR-Lite)

For any non-trivial decision, document:
- **Decision**: What was chosen
- **Context**: Why the decision exists
- **Rationale**: Why this option over alternatives
- **Trade-off**: What was sacrificed and when to revisit

Known architectural commitments (do not contradict):
- pnpm + Turborepo monorepo with Changesets
- `docu.json` as universal configuration (framework-agnostic)
- Island hydration for flame (createRoot for complex islands, hydrateRoot for stable)
- DaisyUI for SSG, Radix UI for Next.js
- Plugin system via `PluginBuilder` pattern (10 hooks)
- Dual Tailwind pipeline (CLI for flame, PostCSS for Next.js)
- CSP with nonce per page, `unsafe-eval` only in dev/preview
- Incremental build with SHA-256 content hashing

### 4. Implementation Steps

1. Type changes / schema updates first
2. Core logic (tests alongside)
3. Integration (wire into build/server)
4. Documentation (update architecture docs)
5. Changeset for version bump

### 5. Testing Strategy

- Unit: new logic in isolation (Vitest)
- Integration: plugin loading, build pipeline, server routes
- Manual: `bun run dev` + `bun run build` for flame changes
- All packages: `turbo test` must pass

### Repository Conventions

- All code changes on feature branches from `main`.
- Conventional commits: `type(scope): description` (feat, fix, refactor, chore, docs, test, ci).
- Changeset required for any public package version change (core, mdx-content, flame, cli, ui-react, themes-colors).
- PR description should link to the plan or issue.
- Architecture documentation lives in the root `ARCHITECTURE.md`. Update it when changing component inventory, data flow, security model, or key decisions.
