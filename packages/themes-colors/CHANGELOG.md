# @docubook/themes-colors

## 0.10.3

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
