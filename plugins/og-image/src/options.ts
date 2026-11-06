/**
 * Plugin options from `docu.json` and their validation. Pure: no file system
 * and no flame imports, so a typo stops `flame build` and `flame dev` before
 * anything else runs.
 */

export const LOG_PREFIX = "[plugin:og-image]";

export type Layout = "card" | "minimal";

export const LAYOUTS: readonly Layout[] = ["card", "minimal"];

export interface FontOption {
  /** Font file (TTF, OTF, WOFF or WOFF2), relative to the project root. */
  path: string;
  /** Weight the file provides. Default: read from the file. */
  weight?: number;
  /** Style the file provides. Default: read from the file. */
  style?: "normal" | "italic";
}

export interface PagesOption {
  /** Docs pages. Default `true`. */
  docs?: boolean;
  /** The docs index (`docs/index.mdx`). Default `true`. */
  index?: boolean;
  /** The landing page, when `meta.ogImage` does not already set its image. Default `true`. */
  home?: boolean;
}

export interface OgImageOptions {
  /** Card layout. Default `card`. */
  layout?: Layout;
  /**
   * Logo file: a path relative to the project root, or a site path such as
   * `/docs/assets/images/logo.svg`. SVG, PNG, JPEG or WebP, at most 1 MB.
   * `false` renders no logo. Default: `navbar.logo.src`.
   */
  logo?: string | false;
  /** Name in the card's top row. Default: `navbar.logoText`, then `meta.title`. */
  siteName?: string;
  /** Which pages get a card. */
  pages?: PagesOption;
  /**
   * Fonts tried before the built-in Geist, which covers Latin-1 only. Add one
   * for titles in other scripts.
   */
  fonts?: FontOption[];
}

export interface ResolvedOptions {
  layout: Layout;
  /** `undefined` means "use `navbar.logo.src`". */
  logo: string | false | undefined;
  siteName: string | undefined;
  pages: Required<PagesOption>;
  fonts: FontOption[];
}

const KNOWN_KEYS = new Set(["layout", "logo", "siteName", "pages", "fonts"]);
const PAGE_KEYS = new Set(["docs", "index", "home"]);

const EXAMPLE = `Example:
  "plugins": [["@docubook/plugin-og-image", { "layout": "card" }]]`;

function fail(message: string): never {
  throw new Error(`${LOG_PREFIX} ${message}\n${EXAMPLE}`);
}

/**
 * A value that names something on another host or inline data rather than a
 * local file: `https://…`, `//cdn…`, `data:…`. Single-letter schemes are left
 * alone so a Windows drive path (`C:\…`) is not mistaken for a URL.
 */
export function isRemoteReference(value: string): boolean {
  return /^[a-z][a-z\d+.-]+:/i.test(value) || value.startsWith("//");
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function resolveOptions(input: unknown): ResolvedOptions {
  if (input === undefined || input === null) input = {};
  if (!isPlainObject(input)) fail("options must be an object.");

  for (const key of Object.keys(input)) {
    if (!KNOWN_KEYS.has(key)) {
      fail(`unknown option "${key}". Valid options: ${[...KNOWN_KEYS].join(", ")}.`);
    }
  }

  const layout = input.layout ?? "card";
  if (typeof layout !== "string" || !LAYOUTS.includes(layout as Layout)) {
    fail(`"layout" must be one of ${LAYOUTS.map((l) => `"${l}"`).join(", ")}.`);
  }

  const logo = input.logo;
  if (logo !== undefined && logo !== false) {
    if (typeof logo !== "string" || logo.trim() === "") {
      fail(`"logo" must be a file path or false.`);
    }
    if (isRemoteReference(logo)) {
      fail(`"logo" must be a local file, not "${logo}". The build never downloads files.`);
    }
  }

  const siteName = input.siteName;
  if (siteName !== undefined && (typeof siteName !== "string" || siteName.trim() === "")) {
    fail(`"siteName" must be a non-empty string.`);
  }

  const pages = { docs: true, index: true, home: true };
  if (input.pages !== undefined) {
    if (!isPlainObject(input.pages)) fail(`"pages" must be an object such as { "home": false }.`);
    for (const [key, value] of Object.entries(input.pages)) {
      if (!PAGE_KEYS.has(key)) fail(`unknown key "pages.${key}". Valid keys: docs, index, home.`);
      if (typeof value !== "boolean") fail(`"pages.${key}" must be true or false.`);
      pages[key as keyof typeof pages] = value;
    }
  }

  const fonts: FontOption[] = [];
  if (input.fonts !== undefined) {
    if (!Array.isArray(input.fonts)) fail(`"fonts" must be an array of { "path": "…" }.`);
    input.fonts.forEach((font, i) => {
      if (!isPlainObject(font) || typeof font.path !== "string" || font.path.trim() === "") {
        fail(`"fonts[${i}].path" must be a file path.`);
      }
      if (isRemoteReference(font.path)) {
        fail(`"fonts[${i}].path" must be a local file, not "${font.path}".`);
      }
      if (
        font.weight !== undefined &&
        (typeof font.weight !== "number" || font.weight < 1 || font.weight > 1000)
      ) {
        fail(`"fonts[${i}].weight" must be a number from 1 to 1000.`);
      }
      if (font.style !== undefined && font.style !== "normal" && font.style !== "italic") {
        fail(`"fonts[${i}].style" must be "normal" or "italic".`);
      }
      fonts.push({
        path: font.path,
        ...(font.weight !== undefined && { weight: font.weight as number }),
        ...(font.style !== undefined && { style: font.style as "normal" | "italic" }),
      });
    });
  }

  return {
    layout: layout as Layout,
    logo: logo as string | false | undefined,
    siteName: siteName as string | undefined,
    pages,
    fonts,
  };
}
