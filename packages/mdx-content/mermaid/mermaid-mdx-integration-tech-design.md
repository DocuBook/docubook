# Mermaid-MDX Integration — Technical Design Brief

> **Feature:** Mermaid.js diagram rendering inside MDX content
> **Package:** `@docubook/mdx-content`
> **Status:** Draft v1
> **Date:** 2026-07-03

---

## 1. Requirements Analysis

### Actors & Roles

|         Actor         |          Role          |                          Responsibility                          |
| --------------------- | ---------------------- | ---------------------------------------------------------------- |
| **Content Author**    | Documentation writer   | Writes Mermaid diagram definitions inside `.mdx` files           |
| **Reader / End User** | Documentation consumer | Views rendered SVG diagrams in browser                           |
| **DocuBook Platform** | Rendering engine       | Compiles MDX → React tree, hydrates Mermaid diagrams client-side |

### Scope

|                                          In Scope                                           |                        Out of Scope                         |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Mermaid diagram rendering in MDX content via custom component `<Mermaid>`                   | Server-side pre-rendering of Mermaid diagrams to static SVG |
| Client-side hydration using `mermaid.run()` API                                             | Mermaid Live Editor integration                             |
| Support for all Mermaid diagram types (flowchart, sequence, class, state, gantt, pie, etc.) | Custom Mermaid theme editor in UI                           |
| Dark/light theme via Mermaid config                                                         | Real-time collaborative diagram editing                     |
| Lazy loading — only render when diagram enters viewport                                     | Mermaid diagram export (PNG/SVG download)                   |

### Invariants

```
1. diagram definition string MUST be non-empty
2. diagram definition MUST be syntactically valid Mermaid
3. component MUST render a placeholder during SSR (Mermaid is browser-only)
4. component MUST NOT throw during SSR — graceful degradation only
5. each diagram instance MUST have a unique DOM id for mermaid.run()
6. mermaid library MUST be loaded only once regardless of diagram count
7. diagram re-render MUST NOT occur on unrelated React state changes
```

---

## 2. Global Benchmarking

### Industry Patterns

- **GitHub Markdown**: Renders Mermaid via `<pre class="mermaid">` — server detects Mermaid blocks, client hydrates with inline mermaid.js.
- **Obsidian**: Uses Mermaid plugin, renders inside note preview, supports dark/light themes.
- **Docusaurus**: `@docusaurus/theme-mermaid` — provides `Mermaid` component using `mermaid.render()` with SSR-safe placeholder and theme sync.
- **VitePress**: Built-in `mermaid` markdown container, renders via `mermaid.run()` on mounted.

### Key Takeaways

|   Source   |                   Approach                   |                                                      Lesson                                                       |
| ---------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Docusaurus | `useEffect` + `mermaid.render()` per diagram | Each diagram needs unique `id`; must `mermaid.parse()` before render                                              |
| VitePress  | `mermaid.run({ nodes })` batch               | More efficient than per-diagram render — one `run()` call processes all `<pre class="mermaid">` tags in container |
| GitHub     | `<pre class="mermaid">` convention           | Simple, declarative — let Mermaid auto-detect elements                                                            |

### Chosen Strategy

Use `mermaid.run({ nodes: [...] })` pattern (VitePress-like) for batch processing, with `<Mermaid>` component rendering a `<pre class="mermaid">` container. This is the most idiomatic React approach — component renders the container, `useEffect` calls `mermaid.run()` on the mounted DOM nodes.

---

## 3. Data Model

### Entities

```mermaid
erDiagram
    MermaidDiagram {
        string id "unique-dom-id"
        string definition "mermaid-syntax-string"
        MermaidConfig config "theme-&-rendering-options"
        MermaidStatus status "pending | parsing | rendering | error"
        string renderedSVG "cached-output"
    }

    MermaidConfig {
        Theme theme "dark | light | neutral"
        boolean startOnLoad "auto-run"
        number maxTextSize "safety-limit"
        string fontFamily "rendering-font"
    }

    MermaidComponent {
        string diagramId "ref-to-MermaidDiagram"
        string containerClass "css-class"
        boolean isSSR "server-rendering-flag"
        MermaidStatus lifecycleStatus "hydration-progress"
    }

    MermaidDiagram ||--|| MermaidConfig : "configured-by"
    MermaidDiagram ||--o{ MermaidComponent : "rendered-as"
```

### Key Design Decisions

1. **Mermaid definition lives in MDX source** — not in a separate file. The `<Mermaid>` component receives the definition as children or a `chart` prop.
2. **Config cascades**: global `mermaid.initialize()` default → per-diagram prop overrides.
3. **SSR renders a placeholder `<pre>`** — Mermaid only runs client-side. No SSR of SVG to avoid hydration mismatch and bundle size.

---

## 4. State Machine

```mermaid
stateDiagram-v2
    [*] --> Mounted : React commit
    Mounted --> Hydrating : useEffect fires
    Hydrating --> Parsing : mermaid.parse(definition)
    Parsing --> Ready : parse OK
    Parsing --> Error : parse FAIL
    Ready --> Rendered : mermaid.run(nodes)
    Error --> Rendered : show error message instead

    state Rendered {
        [*] --> Idle
        Idle --> ThemeChanged : color-scheme media query fires
        ThemeChanged --> ReRendering : re-run with new config
        ReRendering --> Idle : render complete
    }

    Rendered --> [*] : component unmount
```

### Transitions

|      From      |       To       |                   Trigger                   |              Guard              |
| -------------- | -------------- | ------------------------------------------- | ------------------------------- |
| `Mounted`      | `Hydrating`    | `useEffect` mount                           | `typeof window !== 'undefined'` |
| `Hydrating`    | `Parsing`      | `mermaid.parse()` called                    | definition non-empty            |
| `Parsing`      | `Ready`        | parse returns success                       | syntax valid                    |
| `Parsing`      | `Error`        | parse throws                                | syntax invalid                  |
| `Ready`        | `Rendered`     | `mermaid.run({ nodes })`                    | DOM node mounted                |
| `Idle`         | `ThemeChanged` | `matchMedia('prefers-color-scheme')` change | —                               |
| `ThemeChanged` | `ReRendering`  | `mermaid.initialize({ theme })` + re-run    | —                               |

---

## 5. API Surface

### Component: `<Mermaid>`

```
Mermaid {
  required:
    children: string       // Mermaid diagram definition content

  optional:
    id?: string            // custom DOM id (auto-generated if omitted)
    config?: {             // per-diagram MermaidConfig overrides
      theme?: 'dark' | 'light' | 'neutral' | 'forest' | 'base'
      maxTextSize?: number
      fontFamily?: string
    }
    className?: string     // additional CSS class on container

  SSR behavior:
    renders <pre class="mermaid not-prose">{children}</pre>
    — Mermaid auto-detects this tag on client hydration

  Client behavior (hydration):
    1. generate unique id if not provided
    2. import mermaid from 'mermaid' (dynamic import)
    3. mermaid.initialize({ startOnLoad: false, ...mergedConfig })
    4. mermaid.parse(definition) — guard against invalid syntax
    5. mermaid.run({ nodes: [containerRef.current] })
    6. on unmount: no cleanup needed (SVG is plain DOM)
    7. on theme change: detect via matchMedia, re-initialize, re-run
}
```

### MDX Usage

```mdx
<Mermaid>
  graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process]
    B -->|No| D[End]
</Mermaid>
```

```mdx
<Mermaid theme="dark" id="my-diagram">
  sequenceDiagram
    Alice->>John: Hello John, how are you?
    John-->>Alice: Great!
</Mermaid>
```

### Integration Points

|                Layer                |                  Integration                  |                                       Detail                                        |
| ----------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------- |
| **`@docubook/mdx-content`**         | New component `MermaidMdx`                    | Export from `src/components/`, add to `registry/index.ts` and `createMdxComponents` |
| **`@docubook/mdx-content` exports** | Add to `index.ts` (server) and `client.ts`    | Mermaid is client-only — export from `client.ts` only                               |
| **Web app**                         | Add to `mdx-components.ts` built-in overrides | Register `<Mermaid>` tag                                                            |
| **Core compile pipeline**           | No changes needed                             | MDX compilation is agnostic to component internals                                  |
| **package.json**                    | Add `mermaid` as optional peer dependency     | `peerDependenciesMeta.mermaid.optional = true`                                      |

---

## 6. Performance & Scalability

### Data Volume & Patterns

|         Metric          |            Expectation             |
| ----------------------- | ---------------------------------- |
| Diagrams per page       | 1–20 (typical doc page: 1–5)       |
| Diagram definition size | 50–500 chars per diagram           |
| Mermaid library size    | ~2.4 MB full, ~1.2 MB tiny variant |
| Concurrent readers      | N/A (static site, per-reader)      |

### Rendering Strategy

1. **Dynamic import `mermaid`** — not bundled into main JS chunk. Loaded on first `<Mermaid>` mount.
2. **Batch `mermaid.run()`** — single call processes all `<pre class="mermaid">` nodes in the page, not per-diagram.
3. **Lazy hydration** — only render diagrams in/near viewport (IntersectionObserver).
4. **SSR placeholder** — `<pre>` tag is lightweight, no SVG during SSR.

### Caching

|    Cache Layer    |     Key      |           TTL           |    Invalidation    |
| ----------------- | ------------ | ----------------------- | ------------------ |
| Mermaid module    | URL          | Session (browser cache) | Page reload        |
| Parsed definition | content hash | Per-page render         | Component re-mount |
| Config merge      | —            | Per-page render         | Theme change       |

### Theme Synchronization

```mermaid
flowchart LR
    A[CSS prefers-color-scheme] -->|change| B[detectTheme]
    B --> C{theme changed?}
    C -->|yes| D[mermaid.initialize new config]
    D --> E[mermaid.run re-render]
    C -->|no| F[no-op]
```

- Listen to `matchMedia('prefers-color-scheme')` change events.
- On change: call `mermaid.initialize()` with updated theme, then `mermaid.run()`.
- Debounce theme transitions (200ms) to avoid double-render during rapid toggles.

### Bundle Impact

| Asset | Without Mermaid | With Mermaid | Delta |
|-------|----------------|--------------|-------|
| Main JS bundle | ~150 KB | ~150 KB | 0 (dynamic import) |
| Mermaid chunk (lazy) | — | ~120 KB (minified gzip) | +120 KB on diagram pages |
| CSS | existing | +0 (Mermaid renders inline SVG) | 0 |

- Use `mermaid` npm package (not CDN) — tree-shakeable via ES module import.
- Consider `mermaid-tiny` if mindmap/architecture diagrams not needed.

---

## 7. Edge Cases & Resilience

|                Case                 |                                     Strategy                                      |
| ----------------------------------- | --------------------------------------------------------------------------------- |
| **Empty definition**                | `<Mermaid>` with no children → render nothing, warn in dev                        |
| **Invalid Mermaid syntax**          | `mermaid.parse()` throws → render error banner with fallback showing raw code     |
| **SSR / No window**                 | Return `<pre class="mermaid">` placeholder, never import mermaid                  |
| **Multiple rapid re-renders**       | Debounce `mermaid.run()` with 100ms window                                        |
| **Diagram with special HTML chars** | Mermaid handles its own escaping; pass children as string                         |
| **Accessibility**                   | Mermaid generates SVG with `role="img"` and `aria-label` — add `<title>` fallback |
| **RTL content**                     | Mermaid respects direction via config `{ rtl: true }`                             |
| **Very large diagrams**             | `maxTextSize` config caps definition length (default 50000)                       |

---

## 8. File Changes Summary

|                         File                         |                            Action                            |
| ---------------------------------------------------- | ------------------------------------------------------------ |
| `packages/mdx-content/src/components/MermaidMdx.tsx` | **CREATE** — Mermaid component                               |
| `packages/mdx-content/src/components/index.ts`       | **UPDATE** — re-export `MermaidMdx`                          |
| `packages/mdx-content/src/client.ts`                 | **UPDATE** — export `MermaidMdx` (client-only)               |
| `packages/mdx-content/src/registry/index.ts`         | **UPDATE** — register `Mermaid` in `createMdxComponents`     |
| `packages/mdx-content/package.json`                  | **UPDATE** — add `mermaid` as optional peer dep              |
| `apps/web/lib/mdx-components.ts`                     | **UPDATE** — add `Mermaid: MermaidMdx` to built-in overrides |

---

## 9. Verification Checklist

- [ ] Business problem addressed: MDX content authors can embed diagrams without leaving Markdown
- [ ] Data model is backward-compatible: no existing MDX files break
- [ ] Integration points identified: `@docubook/mdx-content` registry + web app override
- [ ] NO code blocks included in this design (only pseudocode/requirements)
- [ ] State machine is complete: covers mount → parse → render → re-theme → unmount
- [ ] Mermaid ERD validated with `mmdc`
- [ ] Mermaid state diagram validated with `mmdc`
- [ ] Mermaid flow diagram validated with `mmdc`
- [ ] Actors + Roles + Scope documented

---

## Related Documents

| Document | Path |
|----------|------|
| Feature Contract | `mermaid-mdx-integration-contract.md` |
| Task Backlog | `mermaid-mdx-integration-tasks.md` |
| Mermaid.js Usage | https://mermaid.js.org/config/usage.html |
| Mermaid.js API | https://mermaid.js.org/config/setup/mermaid/README.html |
