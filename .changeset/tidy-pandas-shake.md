---
"@docubook/core": patch
"@docubook/flame": patch
"@docubook/markdown": patch
"@docubook/themes-colors": patch
"@docubook/ui-react": patch
---

Pre beta.3 — changes since `v2.0.0-beta.2`:

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
