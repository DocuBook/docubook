# Task Backlog: Mermaid-MDX Integration

> **Feature:** Mermaid.js diagram rendering inside MDX content
> **Package:** `@docubook/mdx-content` + `@docubook/core`
> **Tech Stack:** React 19, TypeScript 6, MDX, next-mdx-remote, Mermaid.js ^11
> **Source Contract:** `mermaid-mdx-integration-contract.md`
> **Source Design:** `mermaid-mdx-integration-tech-design.md`
> **Date:** 2026-07-03

---

## Task Table

| Task # | Task Name | Description | Effort | Dependencies | Acceptance Criteria | Source Docs |
|--------|-----------|-------------|--------|--------------|---------------------|-------------|
| T-001 | Add `mermaid` as direct dependency | Add `mermaid` to `dependencies` in `packages/mdx-content/package.json`. Direct dep (not peer) because TypeScript needs types at build time and `import()` is tree-shaken anyway | S | — | `pnpm install` succeeds, `import("mermaid")` resolves in both build and runtime | Contract §Dependency Strategy, Design §5 |
| T-002 | Create `MermaidMdx` component | Build client-side React component: SSR renders `<pre class="mermaid">`, dynamic import via singleton promise (`let p; p ??= import("mermaid")`), `mermaid.parse(chart)`, batch push ref → queueMicrotask → `mermaid.run({ nodes })`, error fallback, auto-generate unique DOM id | M | T-001 | SSR renders placeholder, client hydrates to SVG, syntax error shows raw code, unique id per instance, `mermaid` not in initial bundle, singleton loader (one import) | Contract §API Contract, Design §5 |
| T-003 | Register `MermaidMdx` in package exports | Export from `src/components/index.ts`, add to `src/client.ts` (client-only), register in `src/registry/index.ts` as `Mermaid` in `createMdxComponents` | S | T-002 | `import { MermaidMdx } from "@docubook/mdx-content/client"` resolves, `createMdxComponents` includes `Mermaid` key | Contract §Files Changed |
| T-004 | Wire up `Mermaid` in web app MDX config | Add `Mermaid: MermaidMdx` to `builtInOverrides` in `apps/web/lib/mdx-components.ts` | S | T-003 | ` ```mermaid ` fenced block renders as SVG diagram in docs | Contract §Files Changed |
| T-005 | Theme synchronization via MutationObserver | Implement `MutationObserver` on `document.documentElement.classList`: detect `dark` class toggle → re-initialize mermaid config → re-run diagrams. Debounce 200ms. Works for both next-themes (web) and flame localStorage bootstrap | S | T-002 | Toggle theme via ThemeToggle → diagrams switch theme without page reload | Design §4, §6 |
| T-006 | Write component tests | Unit tests: SSR render output, unique id generation, error fallback, dynamic import singleton mock, MutationObserver theme change handler, empty chart guard, batched render scheduling | S | T-002 | Test coverage for all state machine states (Mounted, Parsing, Ready, Error, Rendered, ThemeChanged) | Design §4, §7 |
| T-007 | Create example MDX page | Create `apps/web/docs/components/mermaid.mdx` with ` ```mermaid ` examples: flowchart, sequenceDiagram, classDiagram, stateDiagram, gantt, pie, erDiagram | S | T-004 | docs/components/mermaid page accessible, all diagrams render correctly | Contract §MDX Usage |
| T-008 | Create `rehypeMermaid` plugin in `@docubook/core` | Create `packages/core/src/plugins/rehypeMermaid.ts`: walk AST for `<pre><code class="language-mermaid">`, extract text content, replace with `<Mermaid chart="...">`. Re-export from `packages/core/src/index.ts` (no `plugins/index.ts` barrel exists yet — either add it or export directly from `src/index.ts`), register in `createDefaultRehypePlugins()` in `compile.ts` | S | T-001 | ` ```mermaid ` compiled MDX renders `<Mermaid chart="...">` element instead of `<pre><code>` | Design §5 |
| T-009 | Add IntersectionObserver lazy loading | Wrap `mermaid.run()` trigger in IntersectionObserver with 200px rootMargin. Off-screen diagrams skip render until they enter/near viewport | S | T-002 | Diagrams below fold only render when scrolled near, reduces main-thread work on pages with many diagrams | Design §6 |

---

## Implementation Order

```
T-001 (dep)
 ├→ T-002 (component) ────────────────────────── T-008 (rehype plugin, no dep on component)
 │    ├→ T-003 (registry exports)
 │    │    └→ T-004 (web app wiring)
 │    │         └→ T-007 (example page)
 │    ├→ T-005 (theme sync) — parallel with T-003
 │    ├→ T-006 (tests) — parallel with T-003, T-004
 │    └→ T-009 (lazy loading) — no dep beyond T-002
 └→ T-008 (rehype plugin in @docubook/core) — parallel path, only needs T-001
```

Execution order:
1. **T-001** — dependency first
2. **T-002 + T-008** (parallel) — component + rehype plugin (different packages, no shared deps)
3. **T-003 + T-005 + T-009** (parallel) — registry, theme sync, lazy loading
4. **T-004 + T-006** (parallel) — web app wiring + tests
5. **T-007** — example page (last, needs everything in place)

---

## Parallel Work Opportunities

| Batch | Tasks | Rationale |
|-------|-------|-----------|
| **Batch A** | T-002, T-008 | Different packages (`mdx-content` vs `core`), different concerns (component vs AST transform) |
| **Batch B** | T-003, T-005, T-009 | Registry export unrelated to theme sync or lazy loading |
| **Batch C** | T-004, T-006 | Web app config unrelated to unit tests in mdx-content package |

---

## Risk Flags

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Mermaid library size (~2.4 MB)** | Medium | Dynamic import + use `mermaid-tiny` if mindmap/architecture diagrams aren't needed |
| **Theme sync mutation observer race** | Low | Debounce 200ms, store chart in ref to restore on re-render (mermaid replaces innerHTML) |
| **Mermaid API breaking changes** | Low | Pin `mermaid` at `^11`, test lock |
| **Hydration mismatch** | Low | SSR renders plain `<pre>`, no SVG — safe from mismatch |
| **Multiple diagrams slow render** | Low | queueMicrotask batch coalesces all pending diagrams into one `mermaid.run()` call |
| **Rehype plugin ordering** | Low | Must run after `preProcess` but before other block transforms — add to correct position in `createDefaultRehypePlugins` array |

---

## Prose: Analysis & Approach

### Simplest Solution?

Yes. The pattern is proven: ` ```mermaid ` fenced block + rehype transform + `<Mermaid chart="...">` + `mermaid.run()` — same approach as GitHub, Docusaurus, and VitePress. The rehype plugin is ~30 lines. The component is ~100 lines.

### Failure Modes

- **Invalid Mermaid syntax** → `mermaid.parse()` throws → component renders error banner with raw code as fallback
- **Dynamic import fails (network error)** → component renders placeholder with error message
- **SSR / no window** → guard `typeof window !== 'undefined'` → return placeholder, never import
- **Empty chart prop** → guard at render start → return null
- **Container unmounts before render completes** → `useEffect` cleanup aborts
- **Rehype plugin mis-ordering** → Mermaid fenced blocks not transformed → render as plain `<pre><code>` instead of diagram

### Security

- Mermaid.js renders SVG — SVG can contain XSS vectors. Mermaid v11 sanitizes SVG output. Ensure version `>=11`.
- Diagram definition comes from MDX source (build-time), not runtime user input → low risk.
- Dynamic import from npm package (not arbitrary CDN) — standard supply chain risk.
- Rehype plugin only transforms compiled MDX AST — no string regex on raw markdown.

### Observability

- Render error: `console.error` with component name + diagram id
- Success render: no log (silent success)
- Theme change: debug log if needed (opt-in)
- Bundle size impact: measurable via `@next/bundle-analyzer` or `webpack-bundle-analyzer`
- Rehype plugin: log if unexpected node structure encountered (dev only)

### Scale to 10x

- 10x diagrams per page (200 diagrams) → batch queueMicrotask coalesces into one `mermaid.run()` call, IntersectionObserver skips off-screen render.
- 10x codebase size → no impact, component < 100 lines, rehype plugin ~30 lines.
- 10x traffic → static site, Mermaid runs on each client independently, zero server load.
