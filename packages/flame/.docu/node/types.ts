import type { ThemeConfig } from "@docubook/themes-colors";
import type { PluginEntry } from "./plugin";

export interface DocuRouteContext {
  title?: string;
  icon?: string;
  description?: string;
}

export interface DocuRoute {
  title: string;
  href: string;
  noLink?: boolean;
  items?: DocuRoute[];
  context?: DocuRouteContext;
}

export interface DocuMeta {
  title: string;
  description: string;
  /** Origin + deployment root, e.g. `https://docubook.pro` or `https://user.github.io`. */
  baseURL: string;
  /**
   * URL prefix the docs site is served under, e.g. "/docs" (default) or
   * "/repo" for a GitHub Pages project site. An empty string serves the site
   * from the deployment root. Set it independently of `baseURL`: the prefix is
   * appended to `baseURL` when building canonical/OG URLs.
   */
  basePath?: string;
  favicon?: string;
  /** Default OG image path (e.g. /docs/assets/images/og.png). Used when page frontmatter has no image. */
  ogImage?: string;
  /**
   * Site-verification tags, written into the `<head>` of every page flame
   * builds: meta name → token, e.g.
   * `{ "algolia-site-verification": "ADCCB4B3D3A8BDCE" }` renders
   * `<meta name="algolia-site-verification" content="ADCCB4B3D3A8BDCE">`.
   */
  verification?: Record<string, string>;
}

export interface SocialLink {
  name: string;
  url: string;
}

export interface DocuNavbar {
  logoText: string;
  logo?: { src?: string; alt?: string };
  menu: { title: string; href: string }[];
}

export interface DocuFooter {
  social: SocialLink[];
}

export interface DocuSidebar {
  /** How context sections are displayed.
   *  "dropdown" — context switcher dropdown (default)
   *  "separator" — inline group headers in sidebar */
  context?: "dropdown" | "separator";
}

export interface RepoConfig {
  url: string;
  path: string;
  edit: boolean;
}

export interface HeroAction {
  text: string;
  link: string;
  theme?: "primary" | "secondary" | "ghost";
  icon?: string;
}

export interface Hero {
  tagline?: string;
  headline: string;
  description?: string;
  actions?: HeroAction[];
}

export interface HomeFeature {
  icon?: string;
  title: string;
  description: string;
  link?: string;
}

export interface HomeConfig {
  hero?: Hero;
  features?: HomeFeature[];
}

export interface ExperimentalConfig {
  /**
   * Bring your own landing page. When `true`, Flame keeps everything it builds
   * under `meta.basePath`: no landing page and no landing bundle (`home` is
   * ignored), the 404 page at `<basePath>/404.html`, and the hashed bundles,
   * asset manifest and search index at `<basePath>/_flame/`. Everything outside
   * the docs prefix is the project's to serve. Defaults to `false` — the
   * generated landing page, the root 404 and the dist-root `assets/` keep
   * shipping until a project opts in.
   */
  pages?: boolean;
}

export interface DocuConfig {
  meta: DocuMeta;
  home?: HomeConfig;
  /** Opt-in features whose behavior may still change between minor releases. */
  experimental?: ExperimentalConfig;
  navbar: DocuNavbar;
  footer: DocuFooter;
  repo: RepoConfig;
  sidebar?: DocuSidebar;
  routes: DocuRoute[];
  themes?: {
    colors: ThemeConfig;
  };
  /** List of DocuBook plugins to load. Empty by default — no-op when absent. */
  plugins?: PluginEntry[];
}

export interface AssetEntry {
  css: string;
  js?: string;
}

export interface AssetManifest {
  docs: AssetEntry;
  /** Landing bundle — absent when the project brings its own pages
   *  (`experimental.pages`), because no landing page is rendered. */
  home?: AssetEntry;
  notFound: AssetEntry;
}

export interface BuildCacheEntry {
  hash: string;
  mtime: number;
  builtAt: number;
}

/** Version stamp stored as `__meta__` — extends entry so the index signature stays valid. */
export interface BuildCacheMeta extends BuildCacheEntry {
  version: number;
  runtime: string;
  /**
   * Fingerprint of the framework's rendering sources. Optional so a cache file
   * written before this field existed is treated as a mismatch and discarded.
   */
  render?: string;
}

export interface BuildCache {
  [path: string]: BuildCacheEntry | undefined;
  __meta__?: BuildCacheMeta;
  __assets__?: BuildCacheEntry;
  __bundle__?: BuildCacheEntry;
}

/** Narrow a cache slot to a real page/asset entry (guards `__meta__` shape). */
export function isCacheEntry(value: unknown): value is BuildCacheEntry {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.hash === "string" && typeof v.mtime === "number" && typeof v.builtAt === "number";
}

export interface CliArgs {
  force?: boolean;
  clean?: boolean;
  ssr?: boolean;
}

export interface ParsedDoc {
  compiledSource: string;
  frontmatter: Record<string, unknown>;
  raw: string;
  scope?: Record<string, unknown>;
}

export type { TocItem } from "@docubook/core";
