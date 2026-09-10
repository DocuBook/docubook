---
"@docubook/core": major
"@docubook/flame": major
"@docubook/markdown": major
"@docubook/themes-colors": major
"@docubook/ui-react": major
---

v2 stable — markdown-native authoring, eval-free hydration (since flame `1.7.2`, baseline `0bfe349`)

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
