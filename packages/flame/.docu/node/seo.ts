import type { DocuConfig } from "./types";
import { frontmatterField } from "./mdx";
import { resolveBasePath, resolveDeployPath } from "./paths";
import { rebaseContentPath } from "./utils";

export interface SeoMeta {
  /** Absolute canonical URL */
  url: string;
  /** Site name for og:site_name */
  siteName: string;
  /** Absolute OG image URL (from frontmatter.image, if set) */
  image?: string;
}

/**
 * Build SEO metadata from config and per-page frontmatter.
 * All fields are derived from existing data — no extra config required.
 *
 * All paths are prefixed with the configured base path so canonical and OG
 * URLs stay correct when the site is served under a subpath.
 */
export function buildSeoMeta(
  config: DocuConfig,
  frontmatter: Record<string, unknown>,
  slug: string
): SeoMeta {
  const baseURL = config.meta?.baseURL?.replace(/\/+$/, "") || "";
  const prefix = resolveBasePath(config);
  const url = slug ? `${baseURL}${prefix}/${slug}` : `${baseURL}/`;

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
    // root"), so resolve the path relative to it. The deployment path is only
    // used to spot an author who spelled the host's segment out themselves.
    const rebased = rebaseContentPath(image.startsWith("/") ? image : `${prefix}/${image}`, prefix);
    const withinRoot = rebased.startsWith(`${deploymentPath}/`)
      ? rebased.slice(deploymentPath.length)
      : rebased;
    return new URL(withinRoot.replace(/^\/+/, ""), `${baseURL}/`).href;
  } catch {
    return image;
  }
}
