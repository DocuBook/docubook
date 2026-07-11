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
  baseURL: string;
  favicon?: string;
  /** Default OG image path (e.g. /docs/assets/images/og.png). Used when page frontmatter has no image. */
  ogImage?: string;
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

export interface DocuConfig {
  meta: DocuMeta;
  home?: HomeConfig;
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

export interface BuildCache {
  [path: string]: {
    hash: string;
    mtime: number;
    builtAt: number;
  };
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
