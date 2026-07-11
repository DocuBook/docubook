import type { DocuConfig } from "./types";

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
 */
export function buildSeoMeta(
  config: DocuConfig,
  frontmatter: Record<string, unknown>,
  slug: string
): SeoMeta {
  const baseURL = config.meta?.baseURL?.replace(/\/+$/, "") || "";
  const url = slug ? `${baseURL}/docs/${slug}` : `${baseURL}/`;

  const result: SeoMeta = {
    url,
    siteName: config.meta?.title || "",
  };

  // Per-page image from frontmatter, fallback to global default from config
  const image =
    (typeof frontmatter.image === "string" && frontmatter.image) || config.meta?.ogImage;
  if (image) {
    // Resolve using URL constructor — handles absolute, root-relative, and relative paths
    try {
      result.image = new URL(image, image.startsWith("/") ? baseURL : `${baseURL}/docs/`).href;
    } catch {
      result.image = image;
    }
  }

  return result;
}
