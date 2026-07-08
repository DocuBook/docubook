import type { ResolvedTheme, ThemeData } from "../types";

/**
 * Full default theme fixture with all 24 variables × 2 modes + syntax tokens.
 * Shared across resolve, generate-css, and hex-to-hsl tests.
 */
export const defaultTheme: ResolvedTheme = {
  variables: {
    root: {
      background: "210 40% 98%",
      foreground: "220 30% 15%",
      card: "0 0% 100%",
      "card-foreground": "220 30% 15%",
      popover: "0 0% 100%",
      "popover-foreground": "220 30% 15%",
      primary: "210 81% 56%",
      "primary-foreground": "0 0% 100%",
      secondary: "210 30% 90%",
      "secondary-foreground": "220 30% 15%",
      muted: "210 20% 92%",
      "muted-foreground": "220 15% 50%",
      accent: "200 100% 40%",
      "accent-foreground": "0 0% 100%",
      destructive: "0 85% 60%",
      "destructive-foreground": "0 0% 100%",
      "border-color": "210 20% 85%",
      input: "210 20% 85%",
      ring: "210 81% 56%",
      radius: "0.5rem",
      "base-100": "100% 0 0",
      "base-200": "98% 0 2",
      "base-300": "95% 0 4",
      "base-content": "222% 47% 11%",
    },
    dark: {
      background: "225 20% 11%",
      foreground: "210 20% 93%",
      card: "225 18% 14%",
      "card-foreground": "210 20% 93%",
      popover: "225 18% 14%",
      "popover-foreground": "210 20% 93%",
      primary: "210 100% 67%",
      "primary-foreground": "225 20% 11%",
      secondary: "220 15% 18%",
      "secondary-foreground": "210 20% 90%",
      muted: "220 12% 20%",
      "muted-foreground": "215 12% 58%",
      accent: "200 100% 62%",
      "accent-foreground": "0 0% 100%",
      destructive: "0 80% 65%",
      "destructive-foreground": "0 0% 100%",
      "border-color": "220 10% 28%",
      input: "220 10% 28%",
      ring: "210 100% 67%",
      radius: "0.5rem",
      "base-100": "22% 0.02 260",
      "base-200": "19% 0.02 260",
      "base-300": "0.6 0 0 / 0.25",
      "base-content": "95% 0.01 260",
    },
  },
  syntax: {
    light: {
      keyword: "#1d4ed8",
      function: "#0369a1",
      punctuation: "#4b5563",
      comment: "#6b7280",
      string: "#0d9488",
      constant: "#0d9488",
      annotation: "#0d9488",
      boolean: "#0d9488",
      number: "#0d9488",
      tag: "#1d4ed8",
      attrName: "#0284c7",
      attrValue: "#2563eb",
    },
    dark: {
      keyword: "#60a5fa",
      function: "#38bdf8",
      punctuation: "#9ca3af",
      comment: "#9ca3af",
      string: "#2dd4bf",
      constant: "#2dd4bf",
      annotation: "#2dd4bf",
      boolean: "#2dd4bf",
      number: "#2dd4bf",
      tag: "#60a5fa",
      attrName: "#7dd3fc",
      attrValue: "#3b82f6",
    },
  },
};

/**
 * Minimal theme fixture for edge-case tests.
 */
export const minimalTheme: ResolvedTheme = {
  variables: {
    root: {
      background: "210 40% 98%",
      foreground: "220 30% 15%",
      primary: "210 81% 56%",
      radius: "0.5rem",
      "base-100": "100% 0 0",
    },
    dark: {
      background: "225 20% 11%",
      foreground: "210 20% 93%",
      primary: "210 100% 67%",
      radius: "0.5rem",
      "base-100": "22% 0.02 260",
    },
  },
  syntax: {
    light: {
      keyword: "#1d4ed8",
      string: "#0d9488",
      "attr-value": "#2563eb",
    },
    dark: {
      keyword: "#60a5fa",
      string: "#2dd4bf",
      "attr-value": "#3b82f6",
    },
  },
};

/**
 * Empty syntax theme fixture.
 */
export const emptySyntaxTheme: ResolvedTheme = {
  variables: {
    root: { background: "0 0% 100%" },
    dark: { background: "0 0% 0%" },
  },
  syntax: { light: {}, dark: {} },
};

/**
 * Mock registry with default and freshlime presets (minimal versions).
 */
export const mockRegistry = {
  default: defaultTheme,
  freshlime: {
    variables: {
      root: {
        background: "85 45% 98%",
        foreground: "85 30% 10%",
        primary: "85 70% 45%",
        ring: "85 70% 45%",
      },
      dark: {
        background: "85 20% 8%",
        foreground: "85 30% 96%",
        primary: "85 75% 55%",
        ring: "85 75% 55%",
      },
    } as ThemeData,
    syntax: { light: {}, dark: {} },
  },
};

/**
 * Complete set of expected variable keys for generateScale.
 */
export const expectedScaleKeys: string[] = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "destructive-foreground",
  "border-color",
  "input",
  "ring",
  "radius",
  "base-100",
  "base-200",
  "base-300",
  "base-content",
];
