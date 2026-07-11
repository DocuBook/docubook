---
'@docubook/flame': patch
'@docubook/mdx-content': patch
---

Generate OpenGraph, Twitter Card, and canonical meta tags from existing config and frontmatter

- Added `buildSeoMeta()` function in `seo.ts` that derives `og:title`, `og:description`, `og:url`, `og:type`, `og:site_name`, `twitter:card`, and canonical link from existing `docuConfig` and per-page frontmatter
- Extended `HtmlShellOptions` with optional `seo` field in both `html.ts` and `html.shared.ts`
- `htmlShell()` now renders OG + Twitter + canonical `<meta>` tags in `<head>` when `seo` is provided
- Integrated into `renderDocsPage()`, landing page, and 404 page in both `build.ts` (Bun) and `build.impl.ts` (Node/Deno)

Added `meta.ogImage` config field for a global OG image fallback. When a page's frontmatter has no `image`, `meta.ogImage` is used as `og:image`. The landing page, docs pages, and 404 page all benefit from this fallback.

Default OG image assets added at `docs/assets/images/og.png` (1648×879) for both the framework docs and the init template.

Fallback chain: `frontmatter.image` > `meta.ogImage` > undefined (no og:image tag).

Added unit tests for `buildSeoMeta()` (16 test cases) and `htmlShell()` SEO output (10 test cases).

### ImageMdx: responsive image scaling

- Changed `width: "100%"` to `maxWidth: "100%"` so images render at natural size up to the container width
- Added `display: flex; justifyContent: center` to the wrapper button for centering small images
- Large images (>container width) automatically scale down; small images stay at natural size
