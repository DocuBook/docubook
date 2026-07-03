# Task Backlog: Mermaid-MDX Integration

> **Feature:** Mermaid.js diagram rendering inside MDX content
> **Package:** `@docubook/mdx-content`
> **Tech Stack:** React 19, TypeScript 6, MDX, next-mdx-remote, Mermaid.js ^11
> **Source Contract:** `mermaid-mdx-integration-contract.md`
> **Source Design:** `mermaid-mdx-integration-tech-design.md`
> **Date:** 2026-07-03

---

## Task Table

| Task # | Task Name | Description | Effort | Dependencies | Acceptance Criteria | Source Docs |
|--------|-----------|-------------|--------|--------------|---------------------|-------------|
| T-001 | Add `mermaid` as optional peer dependency | Add `mermaid` to `peerDependencies` and `peerDependenciesMeta` in `packages/mdx-content/package.json` | S | — | `pnpm install` succeeds, `mermaid` registered as optional peer | Contract §Files Changed |
| T-002 | Create `MermaidMdx` component | Build client-side React component: SSR renders `<pre class="mermaid">`, dynamic import `mermaid`, parse definition, render to SVG via `mermaid.run()`, error fallback for invalid syntax, auto-generate unique DOM id | M | T-001 | SSR renders placeholder, client hydrates to SVG, syntax error shows raw code, unique id per instance, `mermaid` not in initial bundle | Contract §API Contract, Design §5 |
| T-003 | Register `MermaidMdx` in package exports | Export from `src/components/index.ts`, add to `src/client.ts` (client-only), register in `src/registry/index.ts` as `Mermaid` in `createMdxComponents` | S | T-002 | `import { MermaidMdx } from "@docubook/mdx-content/client"` resolves, `createMdxComponents` includes `Mermaid` key | Contract §Files Changed |
| T-004 | Wire up `Mermaid` in web app MDX config | Add `Mermaid: MermaidMdx` to `builtInOverrides` in `apps/web/lib/mdx-components.ts` | S | T-003 | `<Mermaid>` in `.mdx` file renders as SVG diagram in docs | Contract §Files Changed |
| T-005 | Add theme synchronization | Implement `matchMedia('prefers-color-scheme')` listener: detect theme change → re-initialize mermaid config → re-run diagrams. Debounce 200ms | S | T-002 | Toggle theme → diagrams switch theme without page reload | Design §4, §6 |
| T-006 | Write component tests | Unit tests: SSR render output, unique id generation, error fallback, dynamic import mock, theme change handler, empty children guard | S | T-002 | Test coverage for all state machine states (Mounted, Parsing, Ready, Error, Rendered, ThemeChanged) | Design §4, §7 |
| T-007 | Create example MDX page | Create `apps/web/docs/components/mermaid.mdx` with examples: flowchart, sequenceDiagram, classDiagram, stateDiagram, gantt, pie, erDiagram | S | T-004 | docs/components/mermaid page accessible, all diagrams render correctly | Contract §MDX Usage |

---

## Implementation Order

```
T-001 (peer dep)
  └→ T-002 (component)
       ├→ T-003 (registry exports)
       │    └→ T-004 (web app wiring)
       │         └→ T-007 (example page)
       ├→ T-005 (theme sync) — can run parallel with T-003
       └→ T-006 (tests) — can run parallel with T-003, T-004
```

Execution order:
1. **T-001** — dependency first
2. **T-002** — core component
3. **T-003 + T-005** (parallel) — package registration + theme sync
4. **T-004 + T-006** (parallel) — web app wiring + tests
5. **T-007** — example page (last, needs everything in place)

---

## Parallel Work Opportunities

| Batch | Tasks | Rationale |
|-------|-------|-----------|
| **Batch A** | T-003, T-005 | T-003 (registry) unrelated to T-005 (theme sync) — different files, different concerns |
| **Batch B** | T-004, T-006 | T-004 (web app config) unrelated to T-006 (unit tests in its own package) |

---

## Risk Flags

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Mermaid library size (~2.4 MB)** | Medium | Dynamic import + use `mermaid-tiny` if mindmap/architecture diagrams aren't needed |
| **Theme sync race condition** | Low | Debounce 200ms, test rapid theme toggling manually |
| **Mermaid API breaking changes** | Low | Pin `mermaid` at `^11`, test lock |
| **Hydration mismatch** | Low | SSR renders plain `<pre>`, no SVG — safe from mismatch |
| **Multiple diagrams slow render** | Low | Batch `mermaid.run({ nodes: [...] })` — one call for all |

---

## Prose: Analysis & Approach

### Simplest Solution?

Yes. The pattern is proven: `<pre class="mermaid">` + `mermaid.run()` is the simplest and most standard approach. No custom parser, no Webpack loader, no Babel plugin needed. Just one client-side React component that renders a container and calls the Mermaid API in `useEffect`.

### Failure Modes

- **Invalid Mermaid syntax** → `mermaid.parse()` throws → component renders error banner with raw code as fallback
- **Dynamic import fails (network error)** → component renders placeholder with error message
- **SSR / no window** → guard `typeof window !== 'undefined'` → return placeholder, never import
- **Empty children** → guard at render start → return null
- **Container unmounts before render completes** → `useEffect` cleanup aborts

### Security

- Mermaid.js renders SVG — SVG can contain XSS vectors. Mermaid v11 sanitizes SVG output. Ensure version `>=11`.
- Diagram definition comes from MDX source (build-time), not runtime user input → low risk.
- Dynamic import from npm package (not arbitrary CDN) — standard supply chain risk.

### Observability

- Render error: `console.error` with component name + diagram id
- Success render: no log (silent success)
- Theme change: debug log if needed (opt-in)
- Bundle size impact: measurable via `@next/bundle-analyzer` or `webpack-bundle-analyzer`

### Scale to 10x

- 10x diagrams per page (200 diagrams) → batch `mermaid.run()` still one call, bottleneck is DOM. IntersectionObserver for lazy rendering off-screen diagrams.
- 10x codebase size → no impact, component is light (< 200 lines).
- 10x traffic → static site, Mermaid runs on each client independently, zero server load.
