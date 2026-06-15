# @docubook/themes-colors

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
