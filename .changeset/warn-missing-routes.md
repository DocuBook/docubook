---
"@docubook/flame": patch
---

Warn about `routes` entries in `docu.json` that link to a page with no source in `docs/`.

`flame build` and `flame dev` list every such entry with its sidebar trail, for example after a page was renamed or deleted but its sidebar entry was kept. The check builds each link the way the sidebar does: child `href`s are joined onto their parent under the docs prefix. `noLink` sections are skipped, but their items are still checked, and in `sidebar.context: "separator"` mode context sections are treated as headers. It only runs when `docu.json` has a `routes` table, since a scanned sidebar always matches the files. The build still succeeds.

External URLs and fragments in `routes` now work in the sidebar. An `href` with a scheme or starting with `//` was prefixed with the parent path and the docs prefix and suffixed with `.html` (`/docshttps://…html`), and `/intro#setup` became `/docs/intro#setup.html`. The sidebar now links external URLs as written and keeps a `#fragment` or `?query` after `.html`. Pagination and the context switcher skip external entries and treat a fragment link as its page.

The `routes` example in the configuration docs repeated the parent path in child `href`s, which renders links such as `/docs/docs/getting-started/docs/getting-started/introduction`. It now uses relative `href`s like the starter template.
