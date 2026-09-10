# @docubook/themes-colors

## 2.0.1

### Patch Changes

- [#385](https://github.com/DocuBook/docubook/pull/385) [`881f43b`](https://github.com/DocuBook/docubook/commit/881f43be7796f78ddc86a4c682405da105337f68) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - - Scan published `@docubook/ui-react` component output from its shared Tailwind stylesheet, restoring pagination utilities in scaffolded Flame sites without publishing source files.
  - Refresh Flame v2.0.0 release messaging and benchmark documentation with corrected measurements, setup details, and runtime caveats.
  - Keep all linked DocuBook packages on synchronized patch versions.

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

## 1.0.2

### Patch Changes

- [#305](https://github.com/DocuBook/docubook/pull/305) [`11c7167`](https://github.com/DocuBook/docubook/commit/11c7167ea8a064767bdddc3d53aac1aa1f21575b) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - Fix saturation clamping in `generateScale` dark mode

  Three template literals in dark mode (`foreground`, `card-foreground`, `popover-foreground`) used `primaryS - 10` without `Math.max`, producing negative saturation values when `primaryS < 10`. Wrapped all `primaryS - N` expressions with `Math.max` to ensure valid CSS output.

## 1.0.1

### Patch Changes

- [#299](https://github.com/DocuBook/docubook/pull/299) [`d6f9038`](https://github.com/DocuBook/docubook/commit/d6f9038d73e29e5f89410dd75c0e0de286185b82) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - fix(hex-to-hsl): prevent negative saturation in dark mode color scale

  - Clamp `secondary-foreground` saturation to minimum 5% in dark mode
  - Add missing `%` unit on `border-color` value in dark mode

## 1.0.0

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

## 0.10.2

### Patch Changes

- [#225](https://github.com/DocuBook/docubook/pull/225) [`f7997c4`](https://github.com/DocuBook/docubook/commit/f7997c43138abe36c7b4f5f5e2d8dea7a0cb5613) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - fix: bump vitest to 4.1.8 and add esbuild override for GHSA-gv7w-rqvm-qjhr

  Update vitest and `@vitest/coverage-v8` to latest patch versions, and add
  `esbuild` override via pnpm-workspace.yaml to resolve a high-severity
  security advisory (GHSA-gv7w-rqvm-qjhr) — missing binary integrity
  verification in the Deno module, patched in esbuild >=0.28.1.

## 0.10.1

### Patch Changes

- [#216](https://github.com/DocuBook/docubook/pull/216) [`91099c1`](https://github.com/DocuBook/docubook/commit/91099c1be5f17063d151a1a5f1e0dce58b872a5a) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - fix readme for fenced code json content

## 0.10.0

### Minor Changes

- [#201](https://github.com/DocuBook/docubook/pull/201) [`4664e56`](https://github.com/DocuBook/docubook/commit/4664e56d5f4f7f604217c823b07320eda73e5621) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - feat: config-driven theme system with @docubook/themes-colors
  - Create `@docubook/themes-colors` package — 3 presets (default, freshlime, coffee), hex→HSL/OKLch converters, theme resolver, CSS generator
  - Add `themes.colors` in `docu.json` — preset name or custom hex (`{ "primary": "#FF5733" }`)
  - Rename config key `theme.colors` → `themes.colors` to avoid confusion with hero button `theme` prop
  - Remove dead `light?`/`dark?` props from `ThemeConfig` type
  - Inject theme CSS into Tailwind build — resolved theme appended to compiled globals.css
  - Add FOUC prevention — inline `<style>` with theme CSS variables in `<head>` before CSS bundle loads
  - Add `--theme` CLI flag — override theme via `FLAME_THEME` env var
  - Auto-generate syntax highlighting tokens from custom hex primary color (12 tokens × 2 modes)
  - Auto-generate dark daisyUI base colors (base-100/200) from primary via proper sRGB→linear→LMS→OKLab→OKLch pipeline
  - Fix dark daisyUI base hues per preset — freshlime, coffee no longer forced to blue hue 260
  - Extract duplicate theme CSS logic from `build.ts`/`server.ts` into shared `computeInlineThemeCss()`
  - Export `presetRegistry` — pre-built theme registry to replace 6 manual JSON imports
  - Extract test fixtures to `src/__fixtures__/themes.ts` — removes ~260 lines duplication across test files
  - Add proper color space conversion functions: `hslToRgb`, `rgbToOklch`, `hexToOklch`
  - Update template `docu.json` with `themes.colors` for new projects
  - 111 unit/integration tests
