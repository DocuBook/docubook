/** HSL color representation */
export interface HslColor {
  h: number;
  s: number;
  l: number;
}

/** RGB color representation */
export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

/** Oklch color representation */
export interface OklchColor {
  l: number;
  c: number;
  h: number;
}

/**
 * Raw theme data as stored in JSON files.
 * Each theme contains CSS variable values for light (:root) and dark (.dark) modes.
 */
export interface ThemeData {
  /** Root (light mode) CSS variable assignments */
  root: Record<string, string>;
  /** Dark mode CSS variable assignments */
  dark: Record<string, string>;
}

/** Syntax highlighting token colors for one mode */
export interface SyntaxModeTokens {
  keyword: string;
  function: string;
  punctuation: string;
  comment: string;
  string: string;
  constant: string;
  annotation: string;
  boolean: string;
  number: string;
  tag: string;
  attrName: string;
  attrValue: string;
  [key: string]: string;
}

/** Syntax highlighting colors for light + dark modes */
export interface SyntaxTokens {
  light: Partial<SyntaxModeTokens>;
  dark: Partial<SyntaxModeTokens>;
}

/** A fully resolved theme ready for CSS generation */
export interface ResolvedTheme {
  variables: ThemeData;
  syntax: SyntaxTokens;
}

/**
 * User-facing theme configuration.
 * Either a preset name (string) or custom hex color values.
 */
export type ThemeConfig =
  | string
  | {
      primary: string;
    };

/** Registry containing all available preset themes */
export interface ThemeRegistry {
  [name: string]: ResolvedTheme;
}
