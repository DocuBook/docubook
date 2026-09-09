---
"@docubook/core": patch
"@docubook/flame": patch
"@docubook/markdown": patch
"@docubook/themes-colors": patch
"@docubook/ui-react": patch
---

Pre beta.5 — changes since `v2.0.0-beta.4`:

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
