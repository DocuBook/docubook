# Feature Contract: Mermaid-MDX Integration

> **Feature:** Mermaid.js diagram rendering inside MDX content
> **Package:** `@docubook/mdx-content`
> **Tech Stack:** React 19, TypeScript 6, MDX, next-mdx-remote, Mermaid.js
> **Status:** Draft — ready for task breakdown
> **Date:** 2026-07-03
> **Source Design:** `mermaid-mdx-integration-tech-design.md`

---

## Executive Summary

DocuBook content authors want to write diagrams (flowchart, sequence, class, etc.)
directly in `.mdx` files without external tools. This feature provides a `<Mermaid>`
component that renders Mermaid text-based definitions into interactive SVG in the
browser — just like GitHub, Docusaurus, and VitePress.

---

## Scope

| In Scope | Out of Scope |
|----------|--------------|
| `<Mermaid>` component for MDX | SSR pre-render to static SVG |
| Client-side hydration via `mermaid.run()` | Live Editor integration |
| All diagram types (flowchart, sequence, class, state, gantt, pie, git, erd) | Theme editor |
| Dark/light theme via Mermaid config | Export PNG/SVG |
| Lazy loading via IntersectionObserver | Real-time collaboration |
| Error fallback (invalid syntax → show raw code) | — |

### Invariants

1. Diagram definition **MUST** be non-empty
2. Each diagram **MUST** have a unique DOM `id`
3. SSR: render placeholder `<pre class="mermaid">`, **must not** throw
4. `mermaid` library loaded via dynamic import, not in initial bundle
5. Re-render only triggered by theme change, not by other React state

---

## API Contract

### `<Mermaid>` Component

```
Props:
  children: string         (required) — Mermaid syntax definition
  id?: string              (optional) — custom DOM id, auto-generated if empty
  config?: {
    theme?: 'dark' | 'light' | 'neutral' | 'forest' | 'base'
    maxTextSize?: number
    fontFamily?: string
  }
  className?: string       (optional) — additional CSS class
```

### MDX Usage

```mdx
<Mermaid>
  graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process]
</Mermaid>

<Mermaid theme="dark" id="sequence-diagram">
  sequenceDiagram
    Alice->>John: Hello!
</Mermaid>
```

### Lifecycle (SSR → Client)

```
SSR:  <pre class="mermaid not-prose">{children}</pre>
       ↓ (hydrate)
Client:
  1. dynamic import('mermaid')
  2. mermaid.initialize({ startOnLoad: false })
  3. mermaid.parse(definition) — validate syntax
  4. mermaid.run({ nodes: [ref] }) — render to SVG
  5. matchMedia('prefers-color-scheme') listener → re-render on theme change
```

---

## Files Changed

| File | Action |
|------|--------|
| `packages/mdx-content/src/components/MermaidMdx.tsx` | CREATE |
| `packages/mdx-content/src/components/index.ts` | UPDATE — export `MermaidMdx` |
| `packages/mdx-content/src/client.ts` | UPDATE — export `MermaidMdx` (client-only) |
| `packages/mdx-content/src/registry/index.ts` | UPDATE — register `Mermaid` |
| `packages/mdx-content/package.json` | UPDATE — add `mermaid` optional peer dep |
| `apps/web/lib/mdx-components.ts` | UPDATE — add `Mermaid` override |

> **No changes** to `@docubook/core` — the MDX compilation pipeline is untouched.

---

## Verification / Acceptance Criteria

- [ ] Component renders `<pre class="mermaid">` placeholder during SSR
- [ ] Diagram renders as SVG after client hydration
- [ ] Diagram with syntax error shows error fallback (raw code)
- [ ] Dynamic import of `mermaid` does not inflate main JS bundle
- [ ] Dark/light theme syncs automatically
- [ ] Multiple `<Mermaid>` on one page — each has a unique ID
- [ ] `mermaid` imported only once, `run()` called once for all nodes
- [ ] No errors/warnings in console during SSR
- [ ] Existing MDX files unaffected (backward-compatible)

---

## Related Documents

| Document | Path |
|----------|------|
| Technical Design Brief | `mermaid-mdx-integration-tech-design.md` |
| Task Backlog | `mermaid-mdx-integration-tasks.md` |
| Mermaid.js Usage | https://mermaid.js.org/config/usage.html |
| Mermaid.js API | https://mermaid.js.org/config/setup/mermaid/README.html |
