export interface DocuRoute {
  title: string;
  href: string;
  noLink?: boolean;
  items?: DocuRoute[];
}

export interface DocuConfig {
  meta: { title: string; description: string; baseURL: string };
  navbar: { logoText: string; menu: { title: string; href: string }[] };
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

export interface SocialLink {
  name: string;
  url: string;
}

export interface RepoConfig {
  url: string;
  path: string;
  edit: boolean;
}