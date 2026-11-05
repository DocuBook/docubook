---
"@docubook/flame": patch
---

Fix two SEO metadata bugs in the build output.

- The docs index (`docs/index.mdx`) got the landing page's canonical and `og:url` (`<baseURL>/`) instead of its own (`<baseURL><basePath>/`) whenever `meta.basePath` has a prefix. Search engines then treated it as a duplicate of the landing page, or, with `experimental.pages`, of the project's own home page. `buildSeoMeta()` now takes the page kind, and the landing page passes `"landing"`.
- `og:image` lost a path segment when the first segment of `meta.basePath` equals the deployment path from `meta.baseURL` (for example `basePath: "/repo"` under `https://acme.github.io/repo`). Every page then pointed at a missing image. The deployment path is now only dropped from an image path when the author wrote it out and what remains is still a docs path, and it is dropped before the path is re-based onto the prefix.
