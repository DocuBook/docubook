---
"@docubook/core": major
"@docubook/flame": major
"@docubook/markdown": major
"@docubook/themes-colors": major
"@docubook/ui-react": major
---

**v2 breaking changes — markdown-native authoring, eval-free hydration**

- **`@docubook/mdx-content` renamed to `@docubook/markdown`** — package is
  markdown components + directives (scope: docubook). Old name stays
  published and deprecated for existing users.
- Eval-free MDX hydration (static ESM modules, no `new Function`),
  `'unsafe-eval'` dropped from CSPs.
- `@docubook/mdx-remote` merged into `@docubook/core` (RSC path removed);
  `@docubook/runt` merged into flame. Both deprecated on npm.

## v1.7.2 → 2.0.0-alpha.0 (v1 lineage — folded into major above)

Baseline `0bfe349`: flame `1.7.2`, core `1.8.2`, mdx-content `3.4.6`,
themes `1.0.2`. Items below shipped in v1 after flame `1.7.2`, folded
into alpha.0 major. No detail repeat — final state lives in Package
changes.

- **feat:** `MermaidMdx` + `rehypeMermaid` born in core `1.8.0` /
  markdown `3.3.0`; v2 only reworks fullscreen canvas + directive path
- **feat:** multi-runtime (`@docubook/runt`: bun/node/deno adapters,
  `FLAME_RUNTIME`, `.docu/lib` precompile) born in `1.8.1`; v2 merges
  into flame
- **feat:** `@docubook/mdx-remote` rewrite (`serialize`, `compileMDX`,
  `MDXRemote`, `blockJS:true`, sanitizer, `_jsxDEV` fix, Next.js adapter
  deleted) born in `1.8.2`; v2 merges into core
- **feat:** SEO — `buildSeoMeta()` (og/twitter/canonical), fallback
  `frontmatter.image` > `meta.ogImage`, responsive `ImageMdx`
  (`maxWidth`, centered)
- **feat:** `flame deploy --docker [--silent]`, multi-stage nginx
  Dockerfile, security headers, CSP `<meta>` in static HTML
- **feat:** config-driven theme system born in themes `1.0.0`; ui-react
  `1.0.0` stability signal, no behavior change
- **fix:** themes `1.0.1`/`1.0.2` saturation clamp (`Math.max`, missing
  `%`); v2 reworks `hex-to-hsl` + tokens (default, coffee, freshlime)
- **fix:** mermaid `3.4.1` — serialized `mermaid.run()`, skip same-theme
  re-render, detached-node guard
- **fix:** `--border` → `--border-color` (daisyUI v5 `--border: 1px`
  collision), `@source inline(...)` safelist, `cleanOldBundles()` into
  `paths.ts`
- **perf (end state, intermediate steps dropped):** single-bundle delivery
  (mermaid inline, no `splitting`), `modulepreload` JS + `preload` CSS,
  island hydration via `hydrateRoot` (`toc-island`, `mdx-content-island`),
  Tailwind build cached by hash, lucide tree-shake via virtual module,
  daisyUI only `light`/`dark`, immutable `Cache-Control` for `/assets/*`

## Package changes

### `@docubook/core` — major

- **feat:** mdx-remote merged in — mdx-compiler (serialize, format-mdx-error,
  sanitizer plugins) now lives in core; `MDXRemoteProps` re-exported
- **feat:** `remarkDirectiveToMdx` plugin — `::` leaf / `:::` item / `::::`
  wrapper directives compile to MDX without authored JSX
- **refactor:** legacy `content.ts` service and `createMdxContentService`
  removed; compile pipeline tightened (parse-once, `TocItem`-only types)

### `@docubook/markdown` — major (renamed from `@docubook/mdx-content`)

- **feat:** markdown-first authoring — directives only, no authored JSX;
  one inline exception `:tooltip[label]{tip="…"}` (single-colon text stays
  literal for URL safety)
- **feat:** Mermaid fullscreen canvas UI — ESC badge, zoom bar
  (− / % / +, percentage click resets to 100%), one-time help panel with
  keyboard shortcuts; native double-tap/pinch/ctrl+wheel zoom blocked;
  touch drag pan; shortcuts on window so Esc works without focus
- **refactor:** components migrated (Note→Callout, Files→TreeMdx), dropped
  Release/Button/Kbd; Tooltip reduced to `(text, tip)` with auto-positioning
  chat-bubble
- **refactor:** `client.ts`/`server.ts` entry split removed → single
  `createMdxComponents` registry + per-file `"use client"` directives

### `@docubook/flame` — major

- **feat:** eval-free MDX hydration (static ESM modules); CSP without
  `'unsafe-eval'`; docs-root island hydrates (empty-slug lookup fixed)
- **feat:** build perf — mdx-manifest keys sorted so the bundle hash is
  stable: no-change builds skip all pages, single-file edits rebuild one;
  dev server memoizes MDX compile by (path, mtime)
- **feat:** `@docubook/runt` runtime adapters (bun/deno/node) merged in;
  docker builder image renamed `docubook/flame`
- **fix:** TOC anchor precision — observer, URL hash, and click jumps now
  agree (single source of truth: CSS scroll-margin; manual `scrollTo` for
  iOS Safari; container-offset formula on desktop; sub-pixel rounding;
  mobile-bar collapse + `scrollend`); anchor offset reduced 216px → 64px
  mobile, 80px → 16px desktop

### `@docubook/themes-colors` — major

- **feat:** contrast utilities — `relativeLuminance`, `contrastRatio`,
  `getContrastingForeground`
- **fix:** hex-to-hsl accuracy reworked; theme tokens updated (default,
  coffee, freshlime)

### `@docubook/ui-react` — major

- **refactor:** package directory renamed `@docubook/ui/react` →
  `@docubook/ui-react`; dropdown + shared type tweaks

## 2.0.0-alpha.0 → 2.0.0-alpha.1

Real changes shipped since `2.0.0-alpha.0`:

### `@docubook/flame` — fix

- **fix:** TOC anchor precision — the scroll observer, URL hash, and click
  jumps now agree (single source of truth: CSS `scroll-margin`; manual
  `scrollTo` for iOS Safari; container-offset formula on desktop; sub-pixel
  rounding; `scrollend` listener; mobile-bar collapse). Anchor offsets reduced
  to 64px mobile / 16px desktop; the hidden desktop TOC island no longer
  hijacks the mobile URL hash
- **fix:** 404 page now uses root-absolute asset URLs — typing a `noLink`
  section path in the address bar renders a fully styled 404 instead of one
  with broken CSS/JS
- **fix:** daisyUI breadcrumb hover underline overridden for non-link crumbs
  (`:not(a):hover` → `text-decoration: none`)
- **feat:** pagination — inline-style components pill nav: ghost Previous (no title),
  Next card with frontmatter description (ellipsized, visible from 640px),
  callout-style primary grading (`bg-primary/15` + solid title + `75%`
  content), calc-based 30/70 split, `no-underline`, next-only navigation on
  the docs index
- **feat:** scaffold template docs rewritten — DRY, directive-based (v2), a
  4-step quick start workflow, first-edit checklist, add-a-page guide, and
  links to www.docubook.pro
- **docs:** `meta.title` trimmed to the brand, `meta.description` reworded to
  the markdown-first positioning

### `@docubook/markdown` — fix/feat

- **feat:** Mermaid fullscreen canvas UI — ESC badge, zoom bar (− / % / +,
  percentage click resets to 100%), one-time help panel with keyboard
  shortcuts; native double-tap / pinch / ctrl+wheel zoom blocked via
  non-passive listeners; touch drag pan; shortcuts on `window` so Esc works
  without focus
- **fix:** double-tap in fullscreen no longer triggers native browser zoom
  (`touch-action: none` + non-passive `touchstart`)

### `@docubook/ui-react` — feat

- **feat:** `PaginationDocs` restyled to the Mintlify/Browserbase reference —
  pill container, ghost prev, `h-16` next card with title + optional
  description, divider, chevrons (never shrunk by flex)

### `@docubook/core` — no changes in this range

### Docs (repo)

- README: DRY refactor — single Quick Start, sequence-diagram architecture,
  no internal package list
- ARCHITECTURE.md: rewritten to the v2 codebase (package map, eval-free
  hydration, corrected CSP/cache values)

## 2.0.0-alpha.1 → 2.0.0-alpha.2

Real changes shipped since `2.0.0-alpha.1`:

### `@docubook/markdown` — fix

- **fix:** tooltip renders as one unified chat bubble — the tail notch now
  paints on top of the body with a 2px overlap, so the body border flows
  continuously into the notch outline (previously two separate borders at
  the junction); open-path tail (no stroke on the attachment edge), concave
  sides read as a proper bubble notch

### `@docubook/flame` — fix/feat

- **feat:** sidebar groups are exclusive accordions — level 2+ groups
  (e.g. Search) default closed, expand on header click, opening one closes
  the other; the group containing the active page auto-expands; chevron uses
  the tree convention (right when closed, down when open)
- **fix:** nested `noLink` groups are styled as links, not section headers
  (no `font-medium`/bold below the top section)
- **fix:** scaffold CSS in the npm install layout — ui-react's Tailwind
  `@source` now lives inside the package's own `styles.css` (imported via
  `@docubook/ui-react/styles.css`) instead of a monorepo-relative path that
  resolves nowhere when the package is installed from a registry

### `@docubook/ui-react` — feat

- **feat:** ships a `styles.css` (`@source "./src"`) so consumers scan the
  component classes from any install layout

### Release (repo)

- **fix:** releases create a single `v<flame version>` tag instead of one tag
  per package — the changesets action publishes all linked packages but
  skips per-package GitHub releases; CI removes the per-package tags and
  creates one `v2.x` tag + release
- **chore:** all packages bumped `2.0.0-alpha.1` → `2.0.0-alpha.2`

## 2.0.0-alpha.2 → 2.0.0-beta.0

Real changes shipped since `2.0.0-alpha.2`:

### `@docubook/flame` — feat/perf

- **feat:** parse-once frontmatter — `frontmatterSchema`
  `.passthrough()`, `serializeWithDocPlugins(..., pre)` reuses pre-pass
  frontmatter + stripped content, registries `registerPageFrontmatter` /
  `registerPageStripped` / `registerPageContent`, `compileMdxModule(...,
  href)`, `route.ts` reads from registry (`readPageFrontmatter`),
  pagination uses `fm.title` / `fm.description`
- **perf:** read-once build — prePass caches raw via
  `getPageContent()`, SSR phase reuses `pre` without re-extract, search
  index skipped when `built === 0`, logger `indexDone(..., skipped)`

## 2.0.0-beta.0 → 2.0.0-beta.1

Real changes shipped since `2.0.0-beta.0`:

### `@docubook/flame` — fix

- **fix:** desktop TOC scroll area independent — long heading
  lists scroll contained, active item stays visible, `Scroll to Top`
  resolves to `#top`, no longer extends TOC tree border

### `@docubook/markdown` — fix

- **fix:** GFM task-list styling centralized in `packages/markdown/styles.css`
  — disabled checkboxes, checked primary, unchecked foreground

## 2.0.0-beta.1 → 2.0.0-beta.2

Real changes shipped since `2.0.0-beta.1`:

### `@docubook/flame` — perf/refactor

- **perf/refactor:** build moves `tsup`/`esbuild` → Vite 8 + Rolldown
  — native ESM only, ui-react drops CJS,
  `bin/compile-lib.mjs` only for Node/Deno compat path, vitest uses
  `import.meta.dirname`

### `@docubook/core` / `@docubook/themes-colors` / `@docubook/ui-react` — no behavior change in this range

- Vite 8 + Rolldown migration only (same public API, native ESM output);
  ui-react drops CJS export conditions, keeps subpath entries
  (`input`, `dropdown`, `modal`, `navbar`)

## 2.0.0-beta.2 → 2.0.0-beta.3 (unreleased)

Commits since `v2.0.0-beta.2` tag (`b9f4023`), not yet versioned:

### `@docubook/flame` — feat/fix

- **feat/perf:** build cache v3 (`71dee26`) —
  `BUILD_CACHE_VERSION = 3`, key = `globals.css` + theme + Tailwind inputs
  (`@theme`/`@source`/`@plugin`/`@utility`/`@config`/`@apply`,
  `tailwind.config.*`, version pins `tailwindcss`/`@tailwindcss/cli`/
  `typography`/`daisyui`) + `runtimeStamp()` + `v3`;
  `hashMdxSources()` with sorted keys; Bun 1.4 support
- **fix:** runtime detection respects bun pm (`c6a13d4` —
  `packages/flame/bin/cli.js`)
- **fix:** dep bump `fast-uri` → `4.1.3` (`96ba7fe`)

### `@docubook/markdown` — fix

- **fix:** bullet dot removed (`c05932e`) —
  `::marker { content: none }`, `padding-inline-start` override, checked
  primary color restored with `display: block` checkmark

### Dropped from notes

- Chore: oxlint + TypeScript 7 migration (`27f42b2`), v1-vs-v2 benchmark
  refresh, README/ARCHITECTURE rewrites
