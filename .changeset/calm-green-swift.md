---
"@docubook/mdx-content": minor
"@docubook/core": minor
"@docubook/flame": patch
---

### `@docubook/mdx-content` — New `MermaidMdx` component

**Feature**

- Added `MermaidMdx` component for rendering [Mermaid.js](https://mermaid.js.org/) diagrams inside MDX content.
- Supports all standard diagram types: `flowchart`, `sequenceDiagram`, `classDiagram`, `stateDiagram`, `gantt`, `pie`, `erDiagram`, `gitGraph`, `journey`, and more.
- Diagrams are rendered **client-side only** — during SSR a `<pre class="mermaid">` placeholder is output instead.
- **Lazy rendering** via `IntersectionObserver` — off-screen diagrams are only rendered when scrolled into view (200px margin), reducing initial paint cost.
- **Theme synchronization** — listens to `<html class>` mutations via `MutationObserver` and automatically re-renders diagrams when the dark/light theme changes.
- **Error fallback** — invalid Mermaid syntax shows the raw chart definition alongside an error message instead of silently failing.
- Singleton dynamic import (`mermaid` loaded once per page regardless of diagram count).
- Exported from `@docubook/mdx-content` and registered in the component registry.

### `@docubook/core` — New `rehypeMermaid` rehype plugin

**Feature**

- Added `rehypeMermaid` rehype plugin that transforms fenced ` ```mermaid ` code blocks into `<Mermaid chart="...">` JSX elements during MDX compilation.
- This avoids JSX parse collisions caused by Mermaid's `{...}` (decision nodes) and `[...]` (label nodes) syntax when written inline as JSX.
- Exported from `@docubook/core` for use in any framework adapter.

### `@docubook/flame` — Sidebar active-item highlight and Mermaid docs

**Fix**

- Active sidebar item now scrolls into view on page load (`scrollIntoView({ block: "nearest" })`).
- Added Mermaid diagram types documentation page to the flame docs site.
