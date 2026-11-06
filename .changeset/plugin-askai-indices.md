---
"@docubook/plugin-search-algolia": patch
---

Ask AI no longer sends the search index with every question unless `askAi.indices` is set. Agent Studio rejects per-request indices when the agent's search tool is in `static` mode, so Ask AI answered every question with "Chat error … does not accept a per-request algolia.indices override" (HTTP 422). Without `indices`, the agent searches the indices configured on its tool. Set `askAi.indices` only for an agent whose search tool is in `dynamic` mode.
