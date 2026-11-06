# @docubook/plugin-search-algolia

## 0.1.1

### Patch Changes

- [#480](https://github.com/DocuBook/docubook/pull/480) [`b29ab09`](https://github.com/DocuBook/docubook/commit/b29ab09fb661adc6f66df0d273c5fa4041ee4ecb) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - Ask AI no longer sends the search index with every question unless `askAi.indices` is set. Agent Studio rejects per-request indices when the agent's search tool is in `static` mode, so Ask AI answered every question with "Chat error … does not accept a per-request algolia.indices override" (HTTP 422). Without `indices`, the agent searches the indices configured on its tool. Set `askAi.indices` only for an agent whose search tool is in `dynamic` mode.
