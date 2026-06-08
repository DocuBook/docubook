---
"@docubook/themes-colors": minor
"@docubook/flame": minor
---

feat: config-driven theme system with @docubook/themes-colors

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
