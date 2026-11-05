import type { DocuConfig } from "./types";
import { frontmatterField } from "./mdx";
import { resolveBasePath, resolveDeployPath } from "./paths";
import { rebaseContentPath } from "./utils";
import { isDocsPath } from "./base-path";

export interface SeoMeta {
  /** Absolute canonical URL */
  url: string;
  /** Site name for og:site_name */
  siteName: string;
  /** Absolute OG image URL (from frontmatter.image, if set) */
  image?: string;
}

/** Which page the metadata is for: a docs page (incl. the docs index) or the
 *  generated landing page at the deployment root. */
export type SeoPage = "docs" | "landing";

/**
 * Build SEO metadata from config and per-page frontmatter.
 * All fields are derived from existing data — no extra config required.
 *
 * All paths are prefixed with the configured base path so canonical and OG
 * URLs stay correct when the site is served under a subpath.
 *
 * The docs index (`slug` `""`) lives at `<baseURL><prefix>/`, the landing page
 * at `<baseURL>/`. They only coincide at a root deployment (`basePath: ""`).
 * Giving the docs index the landing URL made search engines treat it as a
 * duplicate of the landing page — or, with `experimental.pages`, of the
 * project's own home page.
 */
export function buildSeoMeta(
  config: DocuConfig,
  frontmatter: Record<string, unknown>,
  slug: string,
  page: SeoPage = "docs"
): SeoMeta {
  const baseURL = config.meta?.baseURL?.replace(/\/+$/, "") || "";
  const prefix = resolveBasePath(config);
  const url =
    page === "landing"
      ? `${baseURL}/`
      : slug
        ? `${baseURL}${prefix}/${slug}`
        : `${baseURL}${prefix}/`;

  const result: SeoMeta = {
    url,
    siteName: config.meta?.title || "",
  };

  // Per-page image from frontmatter, fallback to global default from config
  const image = frontmatterField(frontmatter, "image") || config.meta?.ogImage;
  if (image) {
    result.image = resolveOgImage(image, baseURL, prefix, resolveDeployPath(config));
  }

  return result;
}

/**
 * Resolve an OG image path to an absolute URL.
 *
 * Handles four shapes:
 *  - absolute (`https://…`) — used verbatim
 *  - root-relative already carrying the prefix (`/repo/assets/og.png`) — used as is
 *  - root-relative still carrying the default prefix (`/docs/assets/og.png`) —
 *    re-based onto `prefix`, so an existing `docu.json` keeps working after the
 *    site moves to a different subpath
 *  - bare relative (`og.png`) — resolved against the prefix directory
 */
function resolveOgImage(
  image: string,
  baseURL: string,
  prefix: string,
  deploymentPath: string
): string {
  try {
    if (/^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(image)) return new URL(image).href;
    // Content assets live under the docs prefix *inside* the deployment root,
    // which `baseURL` already spells out (schema: "origin plus deployment
    // root"), so resolve the path relative to it.
    let path = image.startsWith("/") ? image : `${prefix}/${image}`;
    // An author may have spelled the host's segment out (`/repo/docs/og.png`
    // for `baseURL: …/repo`). Drop it before re-basing — but only when what
    // remains is still a docs path, so a docs prefix that starts with the same
    // segment (`basePath: "/repo"` under `…/repo`) is not cut off. At a root
    // deployment every path is a docs path.
    if (deploymentPath && path.startsWith(`${deploymentPath}/`)) {
      const rest = path.slice(deploymentPath.length);
      if (prefix === "" || isDocsPath(rest, prefix)) path = rest;
    }
    const rebased = rebaseContentPath(path, prefix);
    return new URL(rebased.replace(/^\/+/, ""), `${baseURL}/`).href;
  } catch {
    return image;
  }
}
