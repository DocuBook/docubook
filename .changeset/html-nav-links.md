---
"@docubook/flame": patch
---

fix(flame): append `.html` to generated internal navigation links (sidebar, pagination, context switcher, search index, landing feature cards) so they resolve on static hosts without clean-URL rewriting; the dev server normalizes `/docs/*.html` requests back to their extensionless routes

- add `rehypeDocsHtmlLinks` rehype plugin to append `.html` to internal `/docs/` hrefs on markdown `[text](path)` links (`<a>` elements in HAST)
- add `remarkMdxJsxDocsHtmlLinks` remark plugin to append `.html` to `href` attributes on MDX JSX components (e.g. `<Card href="/docs/…">`) at the MDAST phase, before the MDX compiler converts them to JavaScript
- fix `stripDocsHtmlSuffix` in `utils.ts` to handle the `/docs.html` edge case in addition to `/docs/*.html`
- fix `index.tsx` homepage to apply `.html` suffix to `home.features[].link` and `home.hero.actions[].link` for configured entries, using `isExternalUrl` to skip external URLs
- move imports in `types.ts` to top of file (style fix)
