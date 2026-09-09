# @docubook/ui-react

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

## 1.0.0

### Major Changes

- Mark `@docubook/ui-react` as stable. The component API (Collapse, Modal, Dropdown, Drawer, Input, Kbd, Navbar, Pagination, Toggle, ThemeController, Breadcrumbs) is feature-complete and production-ready. This is an API-stability signal, not a behavioral change — no breaking changes relative to `0.1.4`.

## 0.1.4

### Patch Changes

- [#225](https://github.com/DocuBook/docubook/pull/225) [`f7997c4`](https://github.com/DocuBook/docubook/commit/f7997c43138abe36c7b4f5f5e2d8dea7a0cb5613) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - fix: bump vitest to 4.1.8 and add esbuild override for GHSA-gv7w-rqvm-qjhr

  Update vitest and `@vitest/coverage-v8` to latest patch versions, and add
  `esbuild` override via pnpm-workspace.yaml to resolve a high-severity
  security advisory (GHSA-gv7w-rqvm-qjhr) — missing binary integrity
  verification in the Deno module, patched in esbuild >=0.28.1.

## 0.1.3

### Minor Changes

- feat(kbd): add `FnKey.configure()` for optional Lucide icon support
  - `FnKey.configure({ Command, ChevronUp, ... })` enables Lucide icons globally
  - HTML entities remain the default when `configure()` is not called
  - Partial configuration supported — unconfigured keys fall back to HTML entities
  - Exports `FnKeyIcons` interface for typed icon configuration
  - `lucide-react` remains an optional peer dependency — zero bundle impact without it

## 0.1.2

### Patch Changes

- fix(packages): correct NavMenu activePath delimiter matching
  - Fix false positive active state by requiring `/` delimiter after href prefix
  - Add tests for nested child active state and false positive guard

## 0.1.1

### Patch Changes

- refactor(ui-react): fix cn utility, use client directives, trim pagination
  - Replace `cn()` plain join with `clsx` + `tailwind-merge`
  - Add `clsx@2.1.1` and `tailwind-merge@2.6.1` as dependencies
  - Remove global `use client` banner from `tsup.config.ts`
  - Add `"use client"` directly to `input.tsx` and `kbd.tsx` source files
  - Remove unused pagination components — keep only `PaginationDocs`
  - Clean up related exports in `index.ts`

- fix(ui): remove redundant label in form components

## 0.1.0

### Minor Changes

- feat(ui-react): initial release — React + DaisyUI component library
  - Restructure `packages/ui` → `packages/ui/react` with flat `src/base/` layout
  - Components: `Input`, `InputGroup`, `Kbd`, `FnKey`, `Toggle`, `ToggleGroup`,
    `Dropdown`, `DropdownItem`, `DropdownLink`, `Modal`, `useModal`, `Drawer`,
    `Collapse`, `Accordion`, `ThemeControllerToggle`, `Navbar`, `Logo`,
    `NavMenu`, `NavMenuLink`, `Breadcrumb`, `BreadcrumbItem`, `BreadcrumbList`,
    `BreadcrumbPage`, `PaginationDocs`
  - Per-component tree-shakeable imports via subpath exports
  - `cn()` utility via `@docubook/ui-react/cn`
  - `lucide-react` declared as optional peer dependency
  - `PaginationDocs` supports `prevIcon`, `nextIcon`, `linkClassName` props
  - `Dropdown` supports `menuClassName` prop
  - 83 tests passing
