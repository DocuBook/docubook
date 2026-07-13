# @docubook/mdx-content

## 3.4.5

### Patch Changes

- [#315](https://github.com/DocuBook/docubook/pull/315) [`4ec011d`](https://github.com/DocuBook/docubook/commit/4ec011dd709ba585924bcf92936855aaf27e5ed6) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - **`--docker` + `--silent` flags**, nginx hardening, bundle optimizations, security fixes

  ### New features
  - `flame deploy --docker` — generates Dockerfile (multi-stage, nginx:alpine), nginx.conf, .dockerignore
  - `flame deploy --docker --silent` — suppresses non-essential output, keeps errors only
  - `/docs/assets/` nginx location with 7d cache (vs 1y immutable for `/assets/`)
  - CSP (`Content-Security-Policy`) now included in all static HTML builds via `<meta>` tag
  - nginx config includes security headers (`X-Frame-Options`, `HSTS`, etc.) in all location blocks

  ### Performance
  - **Single-bundle delivery**: removed `splitting: true` from `Bun.build` and esbuild — mermaid and all deps bundled into one entry file (~4.3 MB resource, ~1 MB gzip transferred). Eliminates chunk waterfall, maximizes compression ratio (mermaid DSL strings are highly repetitive), and ensures instant navigation from cache after first load. Best trade-off for docs sites where users navigate across many pages.
  - `<link rel="modulepreload">` added for JS — browser discovers and compiles the module ahead of `<script>` execution, parallel with HTML/CSS
  - `<link rel="preload" as="style">` added for CSS — stylesheet discovered before HTML parsing completes
  - Mermaid bundled eagerly in the single bundle; client-side lazy rendering deferred via IntersectionObserver (no `React.lazy`/`<Suspense>`, preventing content flash and bundler contradiction)
  - `mdx-content` registry: eager `MermaidMdx` import; tsup `splitting` removed to align with flame single-bundle strategy
  - **Island hydration**: `toc-island` and `mdx-content-island` now hydrate via `hydrateRoot` (SSR matches client render). `sidebar-island` remains `createRoot` — SSR renders `<Menu>` only, client renders `<Sidebar>` (different structure), so hydration would mismatch. `mobile-bar-island` SSR div is empty, so `childElementCount` fallback routes to `createRoot` automatically.
  - Removed `/assets/chunks/*` `_headers` rule — chunks no longer emitted under single-bundle strategy
  - Tailwind CSS build cached by content hash — skips subprocess when `globals.css` unchanged
  - Lucide icons tree-shaken via esbuild virtual module — only used icons bundled

  ### Security
  - Stack trace hidden in production error pages
  - `isPathSafe`, `isSlugSafe`, `injectNonce`, `cspHeader` now tested (31 tests)
  - Security penetration test suite added (32 tests, OWASP A02/A03/A05)
  - Empty catch in `scanDirLucideIcons` now logs warning instead of swallowing

  ### Housekeeping
  - `HtmlShellOptions` interface single-sourced in `html.shared.ts`
  - `HEADERS_FILE` constant single-sourced in `deploy.shared.ts`
  - All test files import from `html.shared.ts` instead of Bun-only `html.ts`
  - Deploy tests import actual constants instead of hardcoded copies

## 3.4.4

### Patch Changes

- [#310](https://github.com/DocuBook/docubook/pull/310) [`3a9931e`](https://github.com/DocuBook/docubook/commit/3a9931e18de77475d6a5f27e59df8d0d96e614c8) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - Generate OpenGraph, Twitter Card, and canonical meta tags from existing config and frontmatter

  - Added `buildSeoMeta()` function in `seo.ts` that derives `og:title`, `og:description`, `og:url`, `og:type`, `og:site_name`, `twitter:card`, and canonical link from existing `docuConfig` and per-page frontmatter
  - Extended `HtmlShellOptions` with optional `seo` field in both `html.ts` and `html.shared.ts`
  - `htmlShell()` now renders OG + Twitter + canonical `<meta>` tags in `<head>` when `seo` is provided
  - Integrated into `renderDocsPage()`, landing page, and 404 page in both `build.ts` (Bun) and `build.impl.ts` (Node/Deno)

  Added `meta.ogImage` config field for a global OG image fallback. When a page's frontmatter has no `image`, `meta.ogImage` is used as `og:image`. The landing page, docs pages, and 404 page all benefit from this fallback.

  Default OG image assets added at `docs/assets/images/og.png` (1648×879) for both the framework docs and the init template.

  Fallback chain: `frontmatter.image` > `meta.ogImage` > undefined (no og:image tag).

  Added unit tests for `buildSeoMeta()` (16 test cases) and `htmlShell()` SEO output (10 test cases).

  ### ImageMdx: responsive image scaling
  - Changed `width: "100%"` to `maxWidth: "100%"` so images render at natural size up to the container width
  - Added `display: flex; justifyContent: center` to the wrapper button for centering small images
  - Large images (>container width) automatically scale down; small images stay at natural size

## 3.4.3

### Patch Changes

- [#293](https://github.com/DocuBook/docubook/pull/293) [`e80009d`](https://github.com/DocuBook/docubook/commit/e80009d03dd7c33e0825ebc5c05def76fd749008) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - Rewrite `next-mdx-remote` as `@docubook/mdx-remote` (MPL-2.0)

  - New `@docubook/mdx-remote` package with `serialize()`, `compileMDX()`, and `<MDXRemote>` (RSC + client)
  - Default `blockJS:true` strips JS expressions; defense-in-depth sanitizer audits dangerous patterns in all modes
  - Fixes `_jsxDEV` / `_jsxs` crash by merging both `react/jsx-runtime` and `react/jsx-dev-runtime` into scope
  - Removes `useDynamicImport` from public API (no callers, missing `baseUrl`)
  - Removes dead `parsePositionFromMessage` code
  - Adds unit test coverage (serialize + sanitizer paths)

  Wire `@docubook/core` to consume the new local package instead of `next-mdx-remote`

  - Update imports in `compile.ts` to use `@docubook/mdx-remote/rsc`, `/serialize`, and the main entry
  - Bump `@11ty/gray-matter` to `^2.1.0`

  Remove unused Next.js adapter from `@docubook/mdx-content`

  - Deletes `src/adapters/next/` (ButtonMdx, CardMdx, ImageMdx, LinkMdx)
  - Removes `./next` export and `peerDependenciesMeta.next` from package.json
  - Cleans up tsup build config

  Drop `mdx-jsx-runtime` esbuild/Bun plugin from flame hydrate

  - Plugin was only needed for `next-mdx-remote`'s CJS jsx-runtime shim; our ESM package resolves natively

  Flame build improvements

  - Remove build summary feature (poor DX)
  - Fix runtime detection for Deno npm compat (`process.execPath.includes("deno")` before `typeof Bun`)
  - Generate `deno.json` with `nodeModulesDir: auto` on Deno scaffold
  - Update scaffold next-steps message with Deno freshness policy hint
  - Format `card.mdx` docs section headings + props table

  Stale doc updates

  - `packages/core/README.md`: replace `next-mdx-remote` → `@docubook/mdx-remote`
  - `packages/mdx-content/README.md`: remove `./next` subpath docs
  - `ARCHITECTURE.md`: replace `next-mdx-remote` → `@docubook/mdx-remote` (CSP note, hydration note)

- Updated dependencies [[`e80009d`](https://github.com/DocuBook/docubook/commit/e80009d03dd7c33e0825ebc5c05def76fd749008)]:
  - @docubook/core@1.8.2

## 3.4.2

### Patch Changes

- [#276](https://github.com/DocuBook/docubook/pull/276) [`5289e7d`](https://github.com/DocuBook/docubook/commit/5289e7d1b41359bf5405043df9cf1129631c4e20) Thanks [@pullfrog](https://github.com/apps/pullfrog)! - Multi-runtime support: flame now runs on Node.js (>=20.11) and Deno in addition to Bun.

  - New `@docubook/runt` package: `RuntimeAdapter` interface with `bunAdapter`, `nodeAdapter` (streaming `http.createServer` bridge), and `denoAdapter`.
  - flame CLI detects the runtime (`FLAME_RUNTIME` override supported) and routes `dev`/`build`/`preview`/`deploy` to Bun-native or runtime-neutral entries; existing Bun code paths are unchanged.
  - Runtime-neutral modules: pure `escapeHtml` + shared HTML shell, `child_process`-based git helpers, esbuild client bundling, and `.docu/lib` precompiled JS generated at publish for Node/Deno execution.
  - `@docubook/core`, `@docubook/mdx-content`, `@docubook/themes-colors`: dists are now bundled with tsup, producing self-contained Node-ESM-compatible output.

- [#285](https://github.com/DocuBook/docubook/pull/285) [`32fce19`](https://github.com/DocuBook/docubook/commit/32fce19393df32cf6262abe1a2f38a22c2791067) Thanks [@pullfrog](https://github.com/apps/pullfrog)! - Reduce the client bundle size: enable ESM code splitting in both bundlers (Bun `hydrate.ts` and esbuild `hydrate.node.ts`) so dynamic imports like `mermaid` ship as separate on-demand chunks instead of inlining into the single entry file; select the entry output by `kind`/`entryPoint` rather than position. Restrict daisyUI to `light`/`dark` themes (via `@plugin "daisyui"`) instead of importing all ~35 built-in themes. Add immutable `Cache-Control` for hashed `/assets/*` in `vercel.json` and emit a `_headers` file from `flame deploy` for Netlify/Cloudflare Pages.

  Fix MDX component borders broken by collision between daisyUI v5's `--border` (border width `1px`) and the project's `--border` (HSL color for `--color-border`). DaisyUI's plugin sets `--border: 1px` on `:root` via `:where(:root)` in every theme block; MDX components use `hsl(var(--border, ...))` for inline border colors, so `--border` resolving to `1px` made `hsl(1px)` invalid and border-color invisible. Rename the project's CSS variable from `--border` → `--border-color` across `globals.css`, `@docubook/themes-colors` theme JSONs, theme fixtures, and all 19 `var(--border)` references in `@docubook/mdx-content` component sources. Also remove `--prefersdark` from the daisyUI plugin config.

  Safelist daisyUI dynamic class variants via `@source inline(...)` in `globals.css` so structural classes used by `@docubook/ui-react` components (collapse, breadcrumbs, modal, drawer, navbar, kbd, toggle, input, menu, label) are emitted by Tailwind v4 even though the ui-react package dist is absent and its source builds class names via template literals (`kbd-${size}`, `toggle-${color}`, etc.) that Tailwind cannot statically detect.

  Extract the duplicated `cleanOldBundles()` function—identical across both the Bun and esbuild hydration files—into the shared `paths.ts` module.

- Updated dependencies [[`5289e7d`](https://github.com/DocuBook/docubook/commit/5289e7d1b41359bf5405043df9cf1129631c4e20)]:
  - @docubook/core@1.8.1

## 3.4.1

### Patch Changes

- [#272](https://github.com/DocuBook/docubook/pull/272) [`1f719b1`](https://github.com/DocuBook/docubook/commit/1f719b145035f01094b40e910df725bbc536742c) Thanks [@pullfrog](https://github.com/apps/pullfrog)! - Fix d3-selection `dispatchEvent` TypeError from overlapping mermaid renders: serialize `mermaid.run()` calls, skip theme-sync re-renders when the theme is unchanged, guard against detached nodes, and catch theme-sync render failures with a console warning.

## 3.4.0

### Minor Changes

- [#263](https://github.com/DocuBook/docubook/pull/263) [`d7b6aa9`](https://github.com/DocuBook/docubook/commit/d7b6aa9566fc618fb8c2192763ff15452b56def2) Thanks [@pullfrog](https://github.com/apps/pullfrog)! - Add GFM-style pan, zoom, and fullscreen controls to the `Mermaid` component.

  - Button cluster in the bottom-right corner once a diagram renders: pan up/down/left/right, zoom in/out (clamped 0.4×–4×), reset, and a fullscreen toggle — mirroring GitHub's mermaid viewer.
  - Fullscreen opens the diagram in a lightbox overlay; close it with the button or `Escape`.
  - Keyboard support on the focused diagram container: arrow keys pan, `+`/`-` zoom, `0` resets.
  - Interaction is button and keyboard driven only — mouse drag and scroll-wheel zoom are intentionally not intercepted, so page scrolling over diagrams keeps working.
  - New `panZoom` prop (default `true`) to opt out per diagram.

  **flame**: Tighter spacing in sidebar menu.
  - Reduced `gap-1.5` → `gap-0.5` on menu `<ul>` containers in `Menu.tsx`.
  - Reduced `py-1.5` → `py-1` on sublink items and children container in `Sublink.tsx`.

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
