export interface DocuRoute {
  title: string;
  href: string;
  noLink?: boolean;
  items?: DocuRoute[];
}

export interface DocuMeta {
  title: string;
  description: string;
  baseURL: string;
}

export interface SocialLink {
  name: string;
  url: string;
}

export interface DocuNavbar {
  logoText: string;
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

export interface DocuConfig {
  meta: DocuMeta;
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
  content: React.ReactElement;
  frontmatter: Record<string, unknown>;
  raw: string;
}