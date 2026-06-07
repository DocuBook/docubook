import type { HslColor, OklchColor, RgbColor } from "./types";

/**
 * Convert a hex color string to RGB values.
 * Supports formats: #RGB, #RRGGBB, RGB, RRGGBB
 *
 * @throws {Error} If hex value is invalid
 */
export function hexToRgb(hex: string): RgbColor {
  let h = hex.trim().replace(/^#/, "");

  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }

  if (!/^[0-9a-fA-F]{6}$/.test(h)) {
    throw new Error(`Invalid hex color: "${hex}". Expected format: #RGB, #RRGGBB, or RRGGBB.`);
  }

  const r = Number.parseInt(h.slice(0, 2), 16);
  const g = Number.parseInt(h.slice(2, 4), 16);
  const b = Number.parseInt(h.slice(4, 6), 16);

  return { r, g, b };
}

/**
 * Convert RGB values to HSL.
 * Algorithm adapted from https://en.wikipedia.org/wiki/HSL_and_HSV
 */
export function rgbToHsl(r: number, g: number, b: number): HslColor {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / delta + 2) / 6;
        break;
      case b:
        h = ((r - g) / delta + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert a hex color string directly to HSL.
 */
export function hexToHsl(hex: string): HslColor {
  const rgb = hexToRgb(hex);
  return rgbToHsl(rgb.r, rgb.g, rgb.b);
}

/**
 * Format HSL values to the CSS variable format used by Flame: "h s% l%"
 */
export function hslToString(h: number, s: number, l: number): string;
export function hslToString(hsl: HslColor): string;
export function hslToString(hOrHsl: number | HslColor, s?: number, l?: number): string {
  if (typeof hOrHsl === "object") {
    return `${hOrHsl.h} ${hOrHsl.s}% ${hOrHsl.l}%`;
  }
  return `${hOrHsl} ${s}% ${l}%`;
}

/**
 * Convert an HSL color to an RGB color.
 * Standard HSL → RGB algorithm.
 */
export function hslToRgb(hsl: HslColor): RgbColor {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  const a = s * Math.min(l, 1 - l);
  const f = (n: number): number => {
    const k = (n + h * 12) % 12;
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };

  return {
    r: Math.round(Math.min(Math.max(f(0) * 255, 0), 255)),
    g: Math.round(Math.min(Math.max(f(8) * 255, 0), 255)),
    b: Math.round(Math.min(Math.max(f(4) * 255, 0), 255)),
  };
}

/**
 * Convert an sRGB color to OKLch using proper color space math.
 *
 * Pipeline: sRGB (non-linear) → linear sRGB → LMS → OKLab → OKLch
 */
export function rgbToOklch(rgb: RgbColor): OklchColor {
  // Gamma expansion: sRGB non-linear → linear
  const toLinear = (v: number): number => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const r = toLinear(rgb.r);
  const g = toLinear(rgb.g);
  const b = toLinear(rgb.b);

  // Linear RGB → LMS (OKLab matrix)
  const l_ = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  // Cube root (preserving sign for negative values)
  const lCubed = Math.cbrt(l_);
  const mCubed = Math.cbrt(m);
  const sCubed = Math.cbrt(s);

  // LMS → OKLab
  const labL = 0.2104542553 * lCubed + 0.793617785 * mCubed - 0.0040720468 * sCubed;
  const labA = 1.9779984951 * lCubed - 2.428592205 * mCubed + 0.4505937099 * sCubed;
  const labB = 0.0259040371 * lCubed + 0.7827717662 * mCubed - 0.808675766 * sCubed;

  // OKLab → OKLch
  const c = Math.sqrt(labA * labA + labB * labB);
  const hueRad = Math.atan2(labB, labA);
  const h = (hueRad * 180) / Math.PI;

  return {
    l: labL,
    c,
    h: h < 0 ? h + 360 : h,
  };
}

/**
 * Convert a hex color string directly to OKLch.
 */
export function hexToOklch(hex: string): OklchColor {
  const rgb = hexToRgb(hex);
  return rgbToOklch(rgb);
}

/**
 * Generate a full variable palette from a primary HSL color.
 * Lightness is scaled for semantic roles (background lighter, foreground darker, etc.)
 *
 * NOTE: This is a simple automatic scaling. For best results, users should
 * provide explicit color values for each semantic role.
 */
export function generateScale(primary: HslColor): {
  root: Record<string, string>;
  dark: Record<string, string>;
} {
  const h = primary.h;
  const primaryS = primary.s;

  // Light mode — scale lightness around the primary
  const root: Record<string, string> = {
    background: `${h} ${Math.max(primaryS - 40, 5)}% 98%`,
    foreground: `${h} ${Math.max(primaryS - 20, 10)}% 15%`,
    card: `${h} ${Math.max(primaryS - 40, 5)}% 100%`,
    "card-foreground": `${h} ${Math.max(primaryS - 20, 10)}% 15%`,
    popover: `${h} ${Math.max(primaryS - 40, 5)}% 100%`,
    "popover-foreground": `${h} ${Math.max(primaryS - 20, 10)}% 15%`,
    primary: hslToString(primary),
    "primary-foreground": `${h} ${primaryS}% 100%`,
    secondary: `${h} ${Math.max(primaryS - 40, 5)}% 90%`,
    "secondary-foreground": `${h} ${Math.max(primaryS - 20, 10)}% 15%`,
    muted: `${h} ${Math.max(primaryS - 50, 5)}% 92%`,
    "muted-foreground": `${h} ${Math.max(primaryS - 50, 5)}% 50%`,
    accent: `${Math.min(h + 15, 360)} ${primaryS}% 40%`,
    "accent-foreground": `${h} ${primaryS}% 100%`,
    destructive: `0 85% 60%`,
    "destructive-foreground": `0 0% 100%`,
    border: `${h} ${Math.max(primaryS - 50, 5)}% 85%`,
    input: `${h} ${Math.max(primaryS - 50, 5)}% 85%`,
    ring: hslToString(primary),
    radius: "0.5rem",
    "base-100": `100% 0 0`,
    "base-200": `98% 0 2`,
    "base-300": `95% 0 4`,
    "base-content": `${h + 10} ${primaryS}% 11%`,
  };

  // Compute accurate oklch hue via HSL → RGB → OKLch pipeline
  function getOklchHue(): number {
    const shifted: HslColor = { h: Math.min(h + 5, 360), s: primaryS, l: 45 };
    const rgb = hslToRgb(shifted);
    const oklch = rgbToOklch(rgb);
    return Math.round(oklch.h);
  }
  const oklchHue = getOklchHue();

  // Dark mode — invert the lightness scale
  const dark: Record<string, string> = {
    background: `${h} ${Math.max(primaryS - 40, 5)}% 11%`,
    foreground: `${h} ${primaryS - 10}% 93%`,
    card: `${h} ${Math.max(primaryS - 40, 5)}% 14%`,
    "card-foreground": `${h} ${primaryS - 10}% 93%`,
    popover: `${h} ${Math.max(primaryS - 40, 5)}% 14%`,
    "popover-foreground": `${h} ${primaryS - 10}% 93%`,
    primary: `${h} ${primaryS + 10}% 67%`,
    "primary-foreground": `${h} ${Math.max(primaryS - 20, 5)}% 11%`,
    secondary: `${h + 10} ${Math.max(primaryS - 50, 5)}% 18%`,
    "secondary-foreground": `${h} ${primaryS - 20}% 90%`,
    muted: `${h + 10} ${Math.max(primaryS - 55, 5)}% 20%`,
    "muted-foreground": `${h} ${Math.max(primaryS - 55, 5)}% 58%`,
    accent: `${Math.min(h + 15, 360)} ${primaryS}% 62%`,
    "accent-foreground": `0 0% 100%`,
    destructive: `0 80% 65%`,
    "destructive-foreground": `0 0% 100%`,
    border: `${h + 10} ${Math.max(primaryS - 55, 5)}% 28%`,
    input: `${h + 10} ${Math.max(primaryS - 55, 5)}% 28%`,
    ring: `${h} ${primaryS + 10}% 67%`,
    radius: "0.5rem",
    "base-100": `22% 0.04 ${oklchHue}`,
    "base-200": `19% 0.04 ${oklchHue}`,
    "base-300": `0.6 0 0 / 0.25`,
    "base-content": `95% 0.02 ${oklchHue}`,
  };

  return { root, dark };
}

/**
 * Generate syntax highlighting token colors from a primary HSL color.
 * Produces 12 tokens × 2 modes (light + dark) for code highlighting.
 *
 * Light mode uses darker tones for contrast on light backgrounds.
 * Dark mode uses lighter tones for readability on dark backgrounds.
 */
export function generateSyntaxScale(primary: HslColor): {
  light: Record<string, string>;
  dark: Record<string, string>;
} {
  const { h, s } = primary;

  const hsl = (hue: number, sat: number, light: number): string => `hsl(${hue} ${sat}% ${light}%)`;

  // Light mode — darker tones for contrast on light backgrounds
  const light: Record<string, string> = {
    keyword: hsl(h, s, 30),
    function: hsl(Math.min(h + 10, 360), s, 35),
    punctuation: hsl(h, Math.max(s - 50, 5), 50),
    comment: hsl(h, Math.max(s - 50, 5), 45),
    string: hsl(h, Math.max(s - 20, 15), 35),
    constant: hsl(h, Math.max(s - 20, 15), 35),
    annotation: hsl(h, Math.max(s - 20, 15), 35),
    boolean: hsl(h, Math.max(s - 20, 15), 35),
    number: hsl(h, Math.max(s - 20, 15), 35),
    tag: hsl(h, Math.min(s + 10, 100), 25),
    attrName: hsl(Math.min(h + 10, 360), s, 35),
    attrValue: hsl(h, s, 32),
  };

  // Dark mode — lighter tones for readability on dark backgrounds
  const dark: Record<string, string> = {
    keyword: hsl(h, s, 70),
    function: hsl(Math.min(h + 10, 360), s, 72),
    punctuation: hsl(h, Math.max(s - 50, 5), 65),
    comment: hsl(h, Math.max(s - 50, 5), 60),
    string: hsl(h, Math.max(s - 20, 15), 68),
    constant: hsl(h, Math.max(s - 20, 15), 68),
    annotation: hsl(h, Math.max(s - 20, 15), 68),
    boolean: hsl(h, Math.max(s - 20, 15), 68),
    number: hsl(h, Math.max(s - 20, 15), 68),
    tag: hsl(h, Math.min(s + 10, 100), 75),
    attrName: hsl(Math.min(h + 10, 360), s, 72),
    attrValue: hsl(h, s, 70),
  };

  return { light, dark };
}
