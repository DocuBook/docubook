# ADR-006: Island Hydration — Mixed createRoot + hydrateRoot

## Status

Accepted (Updated 2025-06-06)

## Context

`@docubook/flame` renders static HTML via `renderToString` at build time. Interactive React components need client-side hydration. Flame has five distinct islands that need client React:

1. **Sidebar** — Interactive navigation tree with route links
2. **Mobile bar** — Sticky mobile navigation with drawer
3. **TOC** — Table of Contents with Intersection Observer for active heading tracking
4. **Theme toggle** — Light/dark mode toggle button
5. **MDX content** — Full MDX content with interactive components (Tabs, Accordion, CodeBlock with copy, expandable code)

Initial implementation used `hydrateRoot` for all islands, but caused persistent hydration mismatches for MDX content due to:

1. Bun.build `define` not fixing CJS conditional require in `next-mdx-remote`
2. Browser DOM normalization differing from `renderToString` output
3. `lazy: true` + `hydrateRoot` broken in custom SSR

## Decision

Use a **mixed strategy** — `createRoot` for unstable islands (MDX content, sidebar, mobile bar) and `hydrateRoot` for stable islands (TOC, theme toggle):

```typescript
function mountIsland(
  id: string,
  render: (el: HTMLElement) => React.ReactElement,
  forceCreate = false
) {
  const el = document.getElementById(id);
  if (!el) return;
  const node = render(el);
  // forceCreate=true → always use createRoot (sidebar, mobile-bar, MDX)
  // forceCreate=false → prefer hydrateRoot (TOC, theme)
  if (!forceCreate && el.childElementCount > 0) {
    hydrateRoot(el, node);
  } else {
    el.innerHTML = "";
    createRoot(el).render(node);
  }
}
```

| Island | Strategy | Rationale |
|--------|----------|-----------|
| `sidebar-island` | `createRoot` (`forceCreate: true`) | Interactive sidebar with route tree — SSR menu is replaced |
| `mobile-bar-island` | `createRoot` (`forceCreate: true`) | Sticky mobile bar — SSR placeholder replaced |
| `toc-island` | `hydrateRoot` | Stable DOM — Intersection Observer adds active class; no mismatch risk |
| `theme-island` | `hydrateRoot` | Simple toggle button — no diff risk |
| `mdx-content-island` | `createRoot` | MDX content with `MDXRemote` — highest mismatch risk due to CJS handling |

## Rationale

- **`createRoot` for MDX content** eliminates hydration mismatch — client renders from scratch, no server/client diff
- **`hydrateRoot` for TOC/theme** avoids unnecessary full client re-render for stable islands
- **Bun.build plugin** resolves jsx-runtime via `onLoad` with `loader: "js"` + `contents`
- **Performance acceptable** — MDX islands are small; full page is still static HTML; TOC/theme islands are tiny

## Consequences

- Brief flash possible between static HTML and React mount for `createRoot` islands (mitigated by CSS)
- MDX content requires `unsafe-eval` in CSP for MDX evaluation
- `NODE_ENV=production` must be set during build to get production React runtime
- Cannot use `lazy: true` in `MDXRemote` configuration
- Hydration strategy is explicit per island (`forceCreate` flag) — clear intent in code
- If a `hydrateRoot` island ever causes mismatch, switch to `forceCreate: true` (proven escape hatch)
