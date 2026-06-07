# @docubook/themes-colors

> Theme color presets and color utilities for DocuBook Flame.

This package powers the config-driven theme system in `@docubook/flame`. Themes can be set via `docu.json` → `theme.colors` using a preset name or custom hex values.

## Preset Themes

|    Name     |    Description    |  Hue   |
| ----------- | ----------------- | ------ |
| `default`   | Modern Blue theme | ~210   |
| `freshlime` | Fresh Lime theme  | ~85    |
| `coffee`    | Rich Coffee theme | ~25-35 |

Each preset includes **24 variables** for `:root` (light mode) and `.dark` (dark mode) — covering shadcn-style tokens (background, foreground, primary, etc.) plus daisyUI tokens (base-100, base-200, base-300, base-content) and radius — alongside syntax highlighting token colors.

## Architecture

Theme data is distributed as plain JSON files, making it CDN-friendly:

```
@docubook/themes-colors
├── themes/
│   ├── default.json        ← 24 vars × 2 modes (root + dark)
│   ├── freshlime.json
│   └── coffee.json
├── syntax/
│   ├── default-syntax.json ← 12 tokens × 2 modes
│   ├── freshlime-syntax.json
│   └── coffee-syntax.json
└── src/
    ├── hex-to-hsl.ts       ← Color conversion utilities
    ├── resolve.ts          ← Theme resolver (preset or custom hex)
    ├── generate-css.ts     ← CSS generator
    ├── types.ts            ← TypeScript types
    └── index.ts            ← Public API exports
```

## Usage in @docubook/flame

### docu.json (config-driven)

```json
{
  "themes": {
    "colors": "default"
  }
}
```

Switch presets:

```json
{
  "themes": {
    "colors": "freshlime"
  }
}
```

Use a custom primary color:

```json
{
  "themes": {
    "colors": {
      "primary": "#FF5733"
    }
  }
}

> **Note:** Custom hex themes also get **auto-generated syntax highlighting** (12 tokens × 2 modes) derived from the primary color — matching keywords, strings, comments, and other code tokens to your theme.

### CLI Override

Override any preset without editing `docu.json`:

```bash
flame dev --theme freshlime
flame build --theme coffee
flame preview --theme default
```

## CDN Access (via jsdelivr)

Access raw JSON data for dynamic imports or build-time fetching:

```
https://cdn.jsdelivr.net/npm/@docubook/themes-colors/themes/default.json
https://cdn.jsdelivr.net/npm/@docubook/themes-colors/themes/freshlime.json
https://cdn.jsdelivr.net/npm/@docubook/themes-colors/themes/coffee.json
```

Syntax tokens:

```
https://cdn.jsdelivr.net/npm/@docubook/themes-colors/syntax/default-syntax.json
https://cdn.jsdelivr.net/npm/@docubook/themes-colors/syntax/freshlime-syntax.json
https://cdn.jsdelivr.net/npm/@docubook/themes-colors/syntax/coffee-syntax.json
```

## JavaScript API

```ts
import {
  hexToHsl,
  hslToString,
  hexToRgb,
  rgbToHsl,
  hslToRgb,
  rgbToOklch,
  hexToOklch,
  generateScale,
  generateSyntaxScale,
  resolveTheme,
  generateThemeCss,
  generateSyntaxCss,
  presetRegistry,
} from "@docubook/themes-colors";

// Types
import type {
  HslColor,
  RgbColor,
  OklchColor,
  ThemeData,
  SyntaxTokens,
  ResolvedTheme,
  ThemeConfig,
  ThemeRegistry,
  SyntaxModeTokens,
} from "@docubook/themes-colors";
```

### presetRegistry

Pre-built registry containing all preset themes (`default`, `freshlime`, `coffee`) with their syntax data. Useful when calling `resolveTheme()` — import this instead of manually assembling a registry from individual JSON files.

```ts
const resolved = resolveTheme("freshlime", presetRegistry);
```

### resolveTheme(themeConfig, registry)

Resolves a theme config into a full `ResolvedTheme` object with variables and syntax tokens.

- `themeConfig` — preset name (`"default"`) or custom hex object (`{ primary: "#3B82F6" }`)
- `registry` — map of preset names to theme data

Returns a `ResolvedTheme` ready for CSS generation.

### generateThemeCss(resolved)

Generates a complete CSS string including `@layer base`, `:root` block, and `.dark` block with all CSS variables.

### hexToHsl(hex)

Converts a hex color string to an HSL object (e.g., `"#3B82F6"` → `{ h: 210, s: 81, l: 56 }`).

### hslToRgb(hsl)

Converts an HSL color to an RGB object. Inverse of `rgbToHsl`.

```ts
const rgb = hslToRgb({ h: 210, s: 81, l: 56 });
// => { r: 59, g: 130, b: 246 }
```

### rgbToOklch(rgb)

Converts an sRGB color to OKLch using proper color space math:
`sRGB → linear sRGB → LMS → OKLab → OKLch`.

```ts
const oklch = rgbToOklch({ r: 59, g: 130, b: 246 });
// => { l: 0.53, c: 0.19, h: 260 }  (L=53%, C=0.19, H=260°)
```

### hexToOklch(hex)

Converts a hex color directly to OKLch. Shorthand for `rgbToOklch(hexToRgb(hex))`.

```ts
const oklch = hexToOklch("#3B82F6");
// => { l: 0.53, c: 0.19, h: 260 }
```

### generateScale(primaryHsl)

Generates a complete 24-variable theme scale from a primary HSL color, producing both `:root` (light) and `.dark` mode values.

Includes shadcn-style tokens (background, foreground, card, primary, etc.) and daisyUI surface tokens (base-100/200/300, base-content).

**Custom hex behavior:** When `resolveTheme()` receives a `{ primary: "#..." }` config, it converts the hex to HSL, calls `generateScale()`, and:
- Semantic HSL variables (background, foreground, etc.) — derived via lightness scaling from the primary
- **DaisyUI dark surface tokens** — oklch hue computed via proper HSL→RGB→OKLch color space pipeline (not rough interpolation)
- **Syntax highlighting** — auto-generated via `generateSyntaxScale()` (12 tokens × 2 modes)

```ts
const hsl = { h: 210, s: 81, l: 56 };
const scale = generateScale(hsl);
scale.dark["base-100"];  // "22% 0.04 260" (oklch with proper hue)
```

### generateSyntaxScale(primaryHsl)

Generates syntax highlighting token colors (12 tokens × 2 modes) from a primary HSL color. Used internally by `resolveTheme()` when resolving custom hex themes — automatically applied, no extra config needed.

```ts
const syntax = generateSyntaxScale({ h: 210, s: 81, l: 56 });
syntax.light.keyword;   // "hsl(210 81% 30%)"
syntax.dark.keyword;    // "hsl(210 81% 70%)"
```

### generateSyntaxCss(tokens, options?)

Generates CSS rules for syntax highlighting tokens.

## Token Reference

### CSS Variables (per mode)

|                    Token                     |        Description         |
| -------------------------------------------- | -------------------------- |
| `--background`                               | Page background            |
| `--foreground`                               | Default text color         |
| `--card` / `--card-foreground`               | Card surface & text        |
| `--popover` / `--popover-foreground`         | Popover surface & text     |
| `--primary` / `--primary-foreground`         | Primary brand color & text |
| `--secondary` / `--secondary-foreground`     | Secondary color & text     |
| `--muted` / `--muted-foreground`             | Muted surface & text       |
| `--accent` / `--accent-foreground`           | Accent color & text        |
| `--destructive` / `--destructive-foreground` | Destructive action & text  |
| `--border`                                   | Border color               |
| `--input`                                    | Input field border         |
| `--ring`                                     | Focus ring color           |
| `--radius`                                   | Border radius value        |
| `--base-100` / `--base-200` / `--base-300`   | DaisyUI surface layers     |
| `--base-content`                             | DaisyUI content color      |

### Syntax Tokens (per mode)

`keyword`, `function`, `punctuation`, `comment`, `string`, `constant`, `annotation`, `boolean`, `number`, `tag`, `attrName`, `attrValue`

## Color Formats

- **shadcn-style variables**: HSL format (`h s% l%`) — e.g., `210 81% 56%`
- **daisyUI tokens**: oklch format (`l c h`) — e.g., `100% 0 0`
- **Syntax colors**: Hex or HSL depending on the preset

## License

MIT
