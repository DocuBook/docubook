# @docubook/mdx-content

## 3.3.0

### Minor Changes

- [#253](https://github.com/DocuBook/docubook/pull/253) [`5b864e6`](https://github.com/DocuBook/docubook/commit/5b864e66d03117d408ad11ecdbb79090305eec10) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - ### `@docubook/mdx-content` — New `MermaidMdx` component

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

### Patch Changes

- Updated dependencies [[`5b864e6`](https://github.com/DocuBook/docubook/commit/5b864e66d03117d408ad11ecdbb79090305eec10)]:
  - @docubook/core@1.8.0

## 3.2.2

### Patch Changes

- [#227](https://github.com/DocuBook/docubook/pull/227) [`38ccae0`](https://github.com/DocuBook/docubook/commit/38ccae04cf6fb76490ac66d1f7341615863bf82a) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - chore: bump dependencies and fix prepublishOnly

  - **@docubook/core**: Upgrade TypeScript 5.9.3 → 6.0.3, tailwind-merge 2.6.1 → 3.6.0 (Tailwind v4 compatible, twMerge API unchanged), @types/react 19.2.8 → 19.2.17
  - **@docubook/mdx-content**: Upgrade TypeScript 5.9.3 → 6.0.3, react 19.2.3 → 19.2.7, react-dom 19.2.3 → 19.2.7, @types/react 19.2.8 → 19.2.17; remove redundant `clean` step from prepublishOnly script

- Updated dependencies [[`38ccae0`](https://github.com/DocuBook/docubook/commit/38ccae04cf6fb76490ac66d1f7341615863bf82a)]:
  - @docubook/core@1.7.2

## 3.2.1

### Patch Changes

- docs(mdx-content): add styles.css import guide and CSS customization reference
  - Add README documentation for importing `@docubook/mdx-content/styles.css`
  - Add CSS customization reference for theme tokens
  - Add tests for CardMdx, CardsMdx, and ExpandableCode

- fix: import mdx-content styles.css in all consumer layouts #161
  - Update apps/web layout.tsx to import styles.css
  - Update packages/flame globals.css with mdx-content styles
  - Update nextjs-docker and nextjs-vercel templates

## 3.2.0

### Minor Changes

- refactor: clean up exports and fix unsafe inline style casts ;
  - remove type `note` because there is already type `info`
  - delete components.md standalone docs
  - remove legacy API from README and docs - fix re-exports missing server components
  - fix re-exports missing client components
  - delete re-exports shared utility from public API this internal usage API
  - Remove width: "max-content !important" and backgroundColor: "transparent !important" inline style assignments.
  - Use a CSS class (e.g., .mdx-expandable-code) with !important in a `<style>` tag or CSS file to handle these properties.
  - remove props variation in `<Button>`
  - move duplicated inline style tags to global stylesheet

#### Migration

- **Breaking (styles):** Inline `<style>` tags have been removed from `ExpandableCode`, `CardMdx`, and `CardsMdx`. You must now import the stylesheet in your root layout:
  ```ts
  import "@docubook/mdx-content/styles.css";
  ```

## 3.1.0

### Minor Changes

- refactor: separate shared utils from components and add unit tests ;
  - move shared utilities to src/utils/ (Icon, CopyButton, ExpandableCode, AccordionGroupContext)
  - add trim() normalization in resolveLucideIcon for consistent icon resolution
  - remove redundant normalizedIcon in NoteMdx
  - rename components for consistency (CodeBlock → CodeBlockMdx, CardGroup → CardsMdx, etc.)
  - consolidate registry imports from single barrel
  - update all import paths (components, client, server, index, registry)
  - add unit tests for all components (82 tests across 19 files)
  - add dedicated utils/ test subfolder for shared utility tests
  - fix ExpandableCode test race condition with React 19 scheduler

## 3.0.3

### Patch Changes

- perf(mdx-content): replace hover useState with CSS :hover

## 3.0.2

### Patch Changes

- feat: add peerDependencies @docubook/core

## 3.0.1

### Patch Changes

- fix: improve SSR compatibility for client components ;
  - CardMdx.tsx — add data-card-link attribute for hydration
  - CodeBlock.tsx — add not-prose class to prevent Tailwind prose interference
  - TabsMdx.tsx — render all tab panels for client-side switching
  - TooltipsMdx.tsx — add data-tooltip attributes for hydration

## 3.0.0

### Major Changes

- Major: removed legacy API! use (Tabs, Cards, Accordions, Steps) ;
  - removed API TabsList, TabsTrigger and TabsContent instead (<Tabs> <Tab title="Name">)
  - removed API AccordionGroup instead (<Accordions> <Accordion title="Name">)
  - removed API CardGroup instead (<Cards> <Card title="Name" icon"Lucide">)
  - removed API StepperItem, Stepper instead (<Steps> <Step title="Name">)

  A lightweight API that writes shorter component names that are easier to remember, but still works
  for writing interactive components.

## 2.2.0

### Minor Changes

- 55be6f9: - feat: improvement kbd components mapping
  - fix: icon issue background from card

## 2.1.1

### Patch Changes

- 8205896: feat(mdx-content): refine expandable code blocks and theme fallbacks ;
  - Improve expandable code UX: stable 20-line preview, correct expand/collapse height, and footer
    fixed below content.
  - Fix code line counting (remove off-by-one issues from newline artifacts).
  - Move horizontal scrolling to code content area so footer stays full width.
  - Normalize hsl(var(--token, fallback)) usage across updated MDX components using global theme
    token fallbacks.
  - Inline YouTube block styling in YoutubeMdx (no style override dependency).

## 2.1.0

### Minor Changes

- cdf5a7a: feat(mdx-content): add expandable code block UI with accurate line handling ;
  - Add new ExpandableCode component to support collapsible code blocks with a 20-line default
    preview and toggle footer (See all N lines / Collapse).
  - Update CodeBlock to detect expandable metadata (data-expandable, data-expandable-lines,
    mdx-expandable-code) and render through ExpandableCode.
  - Improve language resolution in CodeBlock by checking data-language, pre class, and nested code
    class; keep fallback to text.
  - Fix total line counting by normalizing CRLF and trimming leading/trailing newline artifacts to
    avoid off-by-one counts.
  - Refine layout behavior: no vertical scroll when expanded, horizontal scroll constrained to code
    content area, footer stays full-width below content.
  - Export ExpandableCode from packages/mdx-content/src/components/index.ts and
    packages/mdx-content/src/index.ts for package consumers.

## 2.0.0

### Major Changes

- 067fb05: refactor(mdx-content): update Tabs, Kbd, AccordionGroup, Steps, and Cards to new API
  - Refactored TabsMdx to new <Tabs>/<Tab> API, improved content scoping, and updated design.
  - Refactored KbdMdx to enforce show prop only (no children).
  - Refactored AccordionGroupMdx to use new AccordionsMdx API, with legacy alias for migration.
  - Refactored StepsMdx/StepMdx for new stepper API, with legacy alias (StepperMdx) for migration.
  - Refactored CardMdx and related card components to new API, with legacy alias for migration.
  - Updated component registry to map new and legacy components for smooth migration.
