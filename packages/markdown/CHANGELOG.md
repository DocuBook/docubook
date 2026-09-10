# @docubook/mdx-content

## 2.0.1

### Patch Changes

- [#385](https://github.com/DocuBook/docubook/pull/385) [`881f43b`](https://github.com/DocuBook/docubook/commit/881f43be7796f78ddc86a4c682405da105337f68) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - - Scan published `@docubook/ui-react` component output from its shared Tailwind stylesheet, restoring pagination utilities in scaffolded Flame sites without publishing source files.
  - Refresh Flame v2.0.0 release messaging and benchmark documentation with corrected measurements, setup details, and runtime caveats.
  - Keep all linked DocuBook packages on synchronized patch versions.
- Updated dependencies [[`881f43b`](https://github.com/DocuBook/docubook/commit/881f43be7796f78ddc86a4c682405da105337f68)]:
  - @docubook/core@2.0.1

## 2.0.0

### Major Changes

- [#383](https://github.com/DocuBook/docubook/pull/383) [`a19c68f`](https://github.com/DocuBook/docubook/commit/a19c68f35286f51257d90f85ece5cbc5fae71f6d) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - v2 stable — markdown-native authoring, eval-free hydration (since flame `1.7.2`, baseline `0bfe349`)

  Consolidated DRY notes — supersedes per-beta chronology. Intermediate steps dropped, end-state only.

  ## Breaking
  - **`@docubook/mdx-content` renamed to `@docubook/markdown`** — directives + components package. Old name stays published deprecated.
  - **`@docubook/mdx-remote` merged into `@docubook/core`** (RSC path removed); **`@docubook/runt` merged into flame**. Both deprecated on npm.
  - **Eval-free MDX hydration** — static ESM modules, no `new Function`; `'unsafe-eval'` dropped from CSP.
  - **Native ESM only** — build `tsup`/`esbuild` → Vite 8 + Rolldown; `ui-react` drops CJS (keeps subpath entries `input`, `dropdown`, `modal`, `navbar`); `bin/compile-lib.mjs` only for Node/Deno compat.
  - **Markdown-first authoring** — directives only (`::` leaf / `:::` item / `::::` wrapper via `remarkDirectiveToMdx`), no authored JSX. One inline exception `:tooltip[label]{tip="…"}`.
  - **Component renames/drops** — `Note`→`Callout`, `Files`→`TreeMdx`; drops `Release`/`Button`/`Kbd`; `Tooltip` reduced to `(text, tip)` auto-position chat-bubble; single `createMdxComponents` registry (no `client.ts`/`server.ts` split).
  - **Plugin API** — `PageType` + page-specific assets via `PageContext`; hooks run for home + standalone 404 in build/dev; `onEnd` gets `outDir`; `assetManifest` passed to dev handlers.
  - **Build cache v3 invalidates old caches** — `BUILD_CACHE_VERSION = 3`, key = `globals.css` + theme + Tailwind inputs + plugin versions + runtime fingerprint.

  ## Feat
  - **Mermaid fullscreen canvas** — ESC badge, zoom bar (− / % / +, click % resets 100%), one-time help + shortcuts on `window`; native double-tap/pinch/ctrl+wheel blocked; touch drag pan. Rerender serialized via persistent chain, stale runs skipped.
  - **TOCs from rendered headings** — `rehypeCollectTocs` collects final h2–h4 IDs post-slug/transform; directive fallbacks preserve authored source via `VFile`.
  - **Parse-once frontmatter / read-once build** — `.passthrough()` schema, `serializeWithDocPlugins(..., pre)` reuses pre-pass, `registerPageFrontmatter/Stripped/Content` registries; SSR/pagination/search reuse without re-extract; search skipped when `built === 0`.
  - **Page-specific assets + stable chunks** — per-route docs/home bundles + styles + manifest; MDX slugs → stable hash virtual IDs (Bun + Vite aligned, no encoded slashes); lazy per-route chunks; only content-hashed JS/CSS/chunks cached immutable; stale client assets pruned on rebuild; `404.html` served with manifest/search revalidate.
  - **Search** — short-query word-prefix ranks above substring (`seq`→`sequence`), typo/substring kept; frontmatter title authoritative, H1 only `lvl1` fallback.
  - **Pagination** — pill nav, ghost Previous, Next card with frontmatter `title`/`description` (ellipsized ≥640px, 30/70 split); last page shows rich `prev` card via `toPaginationEntry()` (no re-parse).
  - **Sidebar** — level 2+ exclusive accordions (active page auto-expands, tree chevrons); nested `noLink` styled as links.
  - **TOC/anchor precision** — CSS `scroll-margin` single source, manual `scrollTo` iOS Safari, container-offset desktop, sub-pixel rounding, `scrollend`, mobile-bar collapse; 64px mobile / 16px desktop; desktop TOC list scrolls contained, wheel chains to prose, `Scroll to Top` → `#top`.
  - **Tabs/Tooltip a11y** — Tabs `ArrowRight/Left/Home/End` activate; Tooltip trigger `id` → `aria-describedby`; `DropdownItem` `button[role=menuitem]` + `onSelect`; `Toggle/Group` base class + indeterminate reset; SSR-deterministic theme (`defaultTheme` first, `localStorage` post-mount).
  - **Themes** — `relativeLuminance`/`contrastRatio`/`getContrastingForeground`; `hex-to-hsl` rework + tokens (default, coffee, freshlime); dark selectors `.dark <prefix> <token>`; hue wraps via `shiftHue()`; fresh fallbacks per `resolveTheme()`.
  - **Deploy** — `flame deploy --docker [--silent]`, multi-stage nginx Dockerfile, builder image `docubook/flame` pinned to installed version (`--bun`), security headers + CSP `<meta>`; single `v2.x` git tag (no per-package tags).
  - **Bun 1.4+** — dual `hydrate.ts` (Bun build/spawn) vs `hydrate.node.ts` (Vite/Rolldown/execFile); `detectPkgManager()` + `--bun` + `FLAME_REEXEC`; 2s `mtimeMs` tolerance; `hookMemoryPressure()` clears derived maps.
  - **SEO/template** — `buildSeoMeta()` (og/twitter/canonical), `frontmatter.image` > `meta.ogImage`, responsive centered `ImageMdx`; scaffold docs rewritten directive-based + 4-step quickstart; 404 reuses home hero/`BackgroundBlobs`, root-absolute assets; home uses shared `ThemeControllerToggle`.
  - **Tailwind delivery** — `styles.css` ships `@source "./src"` per package; `computeTailwindCacheKey()` SHA-256 (+ `@import` cycle guard); ui-react dynamic variants via `@source inline()`; typography GFM task-list centralized, bullet dot removed.

  ## Fix (folded, no repeats)
  - CSP: strip `frame-ancestors` from meta, sync escaped nonce for static preview.
  - Build cache: index fallback, `isCacheEntry()` guard, `atomicWriteFile()` tmp+rename, sorted manifest keys (no-change skip, one-file rebuild), dev memoize by (path, mtime).
  - Scaffold npm layout: `@source` lives in package CSS, not monorepo-relative.
  - `ui-react` types: subpath `types` → `dist/base/*.d.ts` (no more `any`); `mdx-manifest.d.ts` direct `ComponentType`.
  - Breadcrumb non-link hover underline removed.

  ## Chore
  - oxlint (`typescript`, `react`, `unicorn`, `oxc`) + TypeScript 7; pnpm 12 + turbo; `fast-uri` → `4.1.3` (ReDoS); single-tag release + sentry/docker CI harden.
  - v1-lineage folded (born after `1.7.2`, end-state above): `MermaidMdx`/`rehypeMermaid`, multi-runtime adapters, `mdx-remote` rewrite, SEO/Image, docker deploy, config themes, `--border-color` fix, single-bundle/islands/lucide-shake/daisyUI light-dark-only.

### Patch Changes

- Updated dependencies [[`a19c68f`](https://github.com/DocuBook/docubook/commit/a19c68f35286f51257d90f85ece5cbc5fae71f6d)]:
  - @docubook/core@2.0.0

## 2.0.0-beta.5

### Patch Changes

- [#375](https://github.com/DocuBook/docubook/pull/375) [`96138c5`](https://github.com/DocuBook/docubook/commit/96138c5e7574e68cb05cde8c933b6861a5dd1977) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - Pre beta.5 — changes since `v2.0.0-beta.4`:

  ### `@docubook/core` — fix
  - **fix:** compile TOCs from rendered headings — replace regex extraction with `rehypeCollectTocs` on compiled output, collecting final h2–h4 IDs after slugging and custom rehype transforms
  - **fix:** directive fallbacks preserve authored source — `remarkDirectiveToMdx` threads `VFile` source through `transform()` so unsupported literals rebuild exact syntax instead of normalized attributes
  - **docs:** `extractTocsFromRawMdx` now sync-extracts h2–h4 with default heading IDs; `sluggify` marked legacy ASCII helper, not used for compiler heading IDs

  ### `@docubook/flame` — fix
  - **fix:** short query word prefixes rank above exact substrings — `fuzzyMatch()` prefers word-prefix hits (`seq` → `sequence`) over isolated substring occurrences for queries ≤ 3 chars, without removing substring or typo matching
  - **fix:** search indexer H1 handling — frontmatter title stays authoritative, H1 only fills `lvl1` fallback and resets `lvl2–lvl6`; allow extra frontmatter keys via index signature
  - **fix:** TOC scroll chaining — drop `overscroll-contain` on the desktop TOC list so wheel events pass through to `#scroll-container` prose at TOC bounds; `overflow-y-auto` retained for long TOC lists
  - **fix:** `mdx-manifest.d.ts` uses direct `ComponentType` export matching the esbuild virtual module; `BuildCache` index signature allows `undefined` entries

  ### `@docubook/markdown` — fix
  - **fix:** Mermaid rerender chain — serialize runs via persistent `runChainRef`, reset node text + `data-processed` only after prior work settles, skip stale parse/run after unmount or prop change, silence warnings for cancelled runs
  - **feat:** Tabs keyboard nav — `ArrowRight`/`ArrowLeft`/`Home`/`End` move focus and activate wrapped tabs
  - **fix:** Tooltip bubble carries trigger `id` for `aria-describedby` association

  ### `@docubook/themes-colors` — fix
  - **fix:** dark syntax selectors scoped as `.dark <prefix> <token>` so ancestor-scoped blocks resolve in dark mode
  - **fix:** accent hue wraps past 360 via `shiftHue()` instead of clamping
  - **fix:** `resolveTheme()` returns fresh empty syntax fallbacks per call (no shared mutation via factory)
  - **docs:** JSON import attribute `with { type: 'json' }` replaces deprecated `assert`

  ### `@docubook/ui-react` — fix
  - **fix:** theme hydration SSR-deterministic — initial render derives from `defaultTheme`, stored theme syncs post-mount with guarded `localStorage` read/write; `ThemeControllerToggle` gains `ariaLabel` + `inputProps` passthrough
  - **fix:** safelist dynamic Tailwind variants via `@source inline()` (`toggle-*`, `input-*`, `kbd-*`, `modal-*`, responsive `drawer-open`) for standalone consumers
  - **fix:** `Toggle`/`ToggleGroup` always include base `toggle` class; indeterminate driven via merged ref effect with reset
  - **fix:** `DropdownItem` renders focusable `button[role=menuitem]` inside `li[role=none]` with `onSelect` support; `DropdownLink` puts `menuitem` on the anchor
  - **fix:** pagination prev card keeps `shrink-0` label/divider so rich last-page layout stays stable

- Updated dependencies [[`96138c5`](https://github.com/DocuBook/docubook/commit/96138c5e7574e68cb05cde8c933b6861a5dd1977)]:
  - @docubook/core@2.0.0-beta.5

## 2.0.0-beta.4

### Patch Changes

- [#370](https://github.com/DocuBook/docubook/pull/370) [`013e9b5`](https://github.com/DocuBook/docubook/commit/013e9b56e91f6d2c138276f862c64f8fc7830be5) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - Pre beta.4 — changes since `v2.0.0-beta.3`:

  ### `@docubook/flame` — fix
  - **fix:** CSP — strip `frame-ancestors` from meta CSP, sync escaped CSP nonce for static preview
  - **fix:** build cache — support index fallback, harden build cache
  - **feat:** pagination — last page shows rich `prev` card with title + description from parse-once frontmatter registry (`toPaginationEntry()` DRY helper, no re-parse); paired `prev` stays minimal by design

  ### `@docubook/ui-react` — feat/fix
  - **feat:** `PaginationDocs` prev-only variant — rich card (`title` + `description`, left-aligned, back-button layout) when prev stands alone (last page)
  - **fix:** shared `PaginationCard` — next-only now renders `title`/`description` before the `Next` label (`metadata → divider → label`), prev stays `label → divider → metadata`
  - **fix:** subpath declaration mapping — all `types` exports now point to `dist/base/*.d.ts` to match `tsc` output (`@docubook/ui-react/pagination` no longer `any`)

  ### repo — chore
  - **chore:** update pnpm 12 and turbo

- Updated dependencies [[`013e9b5`](https://github.com/DocuBook/docubook/commit/013e9b56e91f6d2c138276f862c64f8fc7830be5)]:
  - @docubook/core@2.0.0-beta.4

## 2.0.0-beta.3

### Patch Changes

- [#364](https://github.com/DocuBook/docubook/pull/364) [`dbbc5cc`](https://github.com/DocuBook/docubook/commit/dbbc5cc61aa201cb4cd61008760230b5356c6f9e) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - Pre beta.3 — changes since `v2.0.0-beta.2`:

  ### `@docubook/flame` — feat/fix
  - **feat/perf:** build cache v3 — `BUILD_CACHE_VERSION = 3`, `__meta__` slot (version + runtime fingerprint), `isCacheEntry()` guard, `shouldRebuild()` 2s tolerance for Bun 1.4 `mtimeMs` float drift, `atomicWriteFile()` tmp + rename pattern
  - **feat/perf:** Tailwind v4 cache key — `computeTailwindCacheKey()` (SHA-256 of `globals.css` + theme + `@theme`/`@source`/`@plugin`/`@utility`/`@config`/`@apply` directives + plugin versions + runtime), `isTailwindRelevantCss()`, `@import` following with cycle protection, `hashMdxSources()` with sorted keys; `resolveAssetManifest()` reuses `manifest.json` on bundle hit
  - **feat:** Bun 1.4+ support — `hookMemoryPressure()` clears derived page maps, requires `bun >= 1.4.0`; dual runtime `hydrate.ts` (Bun `Bun.build` + `Bun.spawn` Tailwind CLI) vs `hydrate.node.ts` (Vite + Rolldown + `execFile`)
  - **fix:** runtime detection respects bun pm — hoisted `detectPkgManager()` in `bin/cli.js`, `--bun` flag, single re-exec under `bun` with `FLAME_REEXEC` guard, silent node fallback when `bun` missing from PATH
  - **fix:** dep bump `fast-uri` → `4.1.3` (ReDoS via `ajv` → `@commitlint/*`)

  ### `@docubook/markdown` — fix
  - **fix:** GFM task list bullet dot removed — added `padding-inline-start: 0 !important` (overrides `@tailwindcss/typography` logical property), spec-valid `::marker { content: none }`, restored checked primary color via `display: block` on `input[type="checkbox"]:checked::after`

  ### `@docubook/core` / `@docubook/themes-colors` / `@docubook/ui-react` — chore
  - Migrated lint ESLint → oxlint (`^1.80.0`) + TypeScript `7.0.2` across all packages; `.oxlintrc.json` (`typescript`, `react`, `unicorn`, `oxc` plugins); fixed duplicate `headers` key in flame server test, fixed `exhaustive-deps` + ref mutation in `MermaidMdx.tsx`

- Updated dependencies [[`dbbc5cc`](https://github.com/DocuBook/docubook/commit/dbbc5cc61aa201cb4cd61008760230b5356c6f9e)]:
  - @docubook/core@2.0.0-beta.3

## 2.0.0-beta.2

### Patch Changes

- [#356](https://github.com/DocuBook/docubook/pull/356) [`5be00ec`](https://github.com/DocuBook/docubook/commit/5be00ec629d8452aec67bda080a4497177c3ac3a) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - Migrate the DocuBook package suite to Vite 8, Rolldown, and native ESM.

  ### `@docubook/core`
  - Switched the library build from `tsup` to Vite 8 with TypeScript declaration output.
  - Preserved the existing ESM entry points and export map structure.
  - Added an explicit `MDXRemote` return type to keep declaration output portable.

  ### `@docubook/flame`
  - Switched the Node and Deno compatibility compiler in `bin/compile-lib.mjs` from `esbuild` to Vite 8 with Rolldown, keeping ESM output in `.docu/lib`.
  - Kept the main runtime pipeline Bun-native and limited Vite/Rolldown to the compatibility build path.
  - Updated the Vitest config to use `import.meta.dirname` for native ESM config loading.
  - Fixed the plugin integration test to await its async assertion cleanly under newer Vitest behavior.

  ### `@docubook/markdown`
  - Switched the library build from `tsup` to Vite 8 with TypeScript declaration output.
  - Preserved the package's ESM-first output while aligning it with the new workspace build flow.

  ### `@docubook/themes-colors`
  - Switched the library build from `tsup` to Vite 8 with TypeScript declaration output.
  - Kept the same public API while continuing to ship native ESM output.

  ### `@docubook/ui-react`
  - Switched the multi-entry library build from `tsup` to Vite 8 with TypeScript declaration output.
  - Simplified the package to native ESM output only and removed CommonJS export conditions.
  - Preserved existing component subpath entry points such as `input`, `dropdown`, `modal`, and `navbar`.

- Updated dependencies [[`5be00ec`](https://github.com/DocuBook/docubook/commit/5be00ec629d8452aec67bda080a4497177c3ac3a)]:
  - @docubook/core@2.0.0-beta.2

## 2.0.0-beta.1

### Patch Changes

- [#354](https://github.com/DocuBook/docubook/pull/354) [`96a479b`](https://github.com/DocuBook/docubook/commit/96a479b7b6987e92dd0c46390885d115a8ad307a) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - Refine TOC scrolling and GFM task list rendering.

  ### `@docubook/flame`
  - Added an independent desktop TOC scroll area for long heading lists with contained overscroll behavior.
  - Kept the active TOC item visible while scrolling long documents.
  - Adjusted the TOC rail and `Scroll to Top` layout so the action no longer extends the TOC tree border.
  - Made `Scroll to Top` resolve to `#top` instead of re-activating the first TOC heading.

  ### `@docubook/markdown`
  - Styled GFM task lists as disabled checkboxes without redundant list bullets.
  - Applied primary styling to checked task items and foreground styling to unchecked task items.
  - Centralized task list styling in `packages/markdown/styles.css` as the source of truth.

## 2.0.0-alpha.0

### Major Changes

- **v2 breaking changes — markdown-native authoring, eval-free hydration**

  - **`@docubook/mdx-content` renamed to `@docubook/markdown`** — package is
    markdown components + directives (scope: docubook). Old name stays
    published and deprecated for existing users.
  - Eval-free MDX hydration (static ESM modules, no `new Function`),
    `'unsafe-eval'` dropped from CSPs.
  - `@docubook/mdx-remote` merged into `@docubook/core` (RSC path removed);
    `@docubook/runt` merged into flame. Both deprecated on npm.

### Patch Changes

- Updated dependencies []:
  - @docubook/core@2.0.0-alpha.0

## 3.4.6

### Patch Changes

- [#340](https://github.com/DocuBook/docubook/pull/340) [`60e4fe5`](https://github.com/DocuBook/docubook/commit/60e4fe53450db7d2bbe28805b5161247c431b461) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - feat(mdx-content): improve mermaid viewing UX with contextual fullscreen controls

  - Remove `panZoom` prop — fullscreen button always shown when diagram renders
  - Show only fullscreen button in normal view (cleaner UI, no clutter)
  - Full pan/zoom controls (pan arrows, zoom +/- , reset) appear only in fullscreen
  - Add scroll-wheel zoom in fullscreen mode
  - Add click-and-drag to pan in fullscreen mode
  - Disable transform transition during drag for responsive feel
  - Enter key toggles fullscreen when diagram is focused

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
