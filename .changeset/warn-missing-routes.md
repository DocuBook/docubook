---
"@docubook/flame": patch
---

Warn about `routes` entries in `docu.json` that link to a page with no source in `docs/`.

`flame build` and `flame dev` list every such entry with its sidebar trail, for example after a page was renamed or deleted but its sidebar entry was kept. The check builds each link the way the sidebar does: child `href`s are joined onto their parent under the docs prefix. `noLink` sections are skipped, but their items are still checked, and in `sidebar.context: "separator"` mode context sections are treated as headers. It only runs when `docu.json` has a `routes` table, since a scanned sidebar always matches the files. The build still succeeds.

The `routes` example in the configuration docs repeated the parent path in child `href`s, which renders links such as `/docs/docs/getting-started/docs/getting-started/introduction`. It now uses relative `href`s like the starter template.
