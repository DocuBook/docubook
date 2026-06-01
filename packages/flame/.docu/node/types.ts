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
  routes: DocuRoute[];
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
