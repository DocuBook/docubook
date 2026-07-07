/**
 * @docubook/themes-colors
 *
 * Theme color presets and color utilities for DocuBook Flame.
 *
 * ## Usage
 *
 * ```ts
 * import { hexToHsl, hslToString } from "@docubook/themes-colors";
 *
 * const hsl = hexToHsl("#3B82F6");
 * // => { h: 210, s: 81, l: 56 }
 *
 * console.log(hslToString(hsl));
 * // => "210 81% 56%"
 * ```
 *
 * ## Preset themes
 *
 * Data files available at:
 * - CDN: https://cdn.jsdelivr.net/npm/@docubook/themes-colors/themes/default.json
 * - CDN: https://cdn.jsdelivr.net/npm/@docubook/themes-colors/themes/freshlime.json
 * - CDN: https://cdn.jsdelivr.net/npm/@docubook/themes-colors/themes/coffee.json
 * - Local (when installed): import data from '@docubook/themes-colors/themes/default.json' assert { type: 'json' }
 *
 * ## Preset themes available
 * - `default` — Modern Blue theme
 * - `freshlime` — Fresh Lime theme
 * - `coffee` — Rich Coffee theme
 */

// Re-export types
export type {
  HslColor,
  RgbColor,
  OklchColor,
  ThemeData,
  SyntaxTokens,
  ResolvedTheme,
  ThemeConfig,
  SyntaxModeTokens,
  ThemeRegistry,
} from "./types";

// Re-export utilities
export {
  hexToRgb,
  rgbToHsl,
  hexToHsl,
  hslToString,
  generateScale,
  generateSyntaxScale,
  hslToRgb,
  rgbToOklch,
  hexToOklch,
} from "./hex-to-hsl";

// Re-export resolver
export { resolveTheme } from "./resolve";

// Re-export CSS generator
export { generateThemeCss, generateSyntaxCss } from "./generate-css";

// Re-export pre-built registry
export { presetRegistry } from "./registry";
