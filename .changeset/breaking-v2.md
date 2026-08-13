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
