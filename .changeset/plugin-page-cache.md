---
"@docubook/flame": minor
---

Keep the page cache when `docu.json` lists plugins. `flame build` used to re-render every docs page on every build as soon as one plugin was configured; it now skips unchanged pages as it does without plugins. Upgrading or rebuilding a plugin package, or editing a local plugin file, still re-renders every page. Per-page hooks (`transformFrontmatter` to `transformHtml`) now run only for pages that are rendered again; `onEnd` still receives every page. Run `flame build --force` after editing a file that a local plugin imports.
