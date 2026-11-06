# @docubook/plugin-search-algolia

## 0.1.2

### Patch Changes

- [#487](https://github.com/DocuBook/docubook/pull/487) [`b5a3310`](https://github.com/DocuBook/docubook/commit/b5a3310576293f87f4bcc5d41a2dd6c17e0e85de) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - Conversations in the Ask AI history can be removed again. The remove (×) button on each conversation was hidden: the Sidepanel reuses the search dialog's `.DocSearch-Hit-action-button`, which the dialog stylesheet hides outside a selected search hit, and the plugin loads both stylesheets. The plugin's stylesheet now shows the button in the conversation history.
- Updated dependencies [[`dffd7d2`](https://github.com/DocuBook/docubook/commit/dffd7d294dd892df346b1fe9db5f2b032cd84bf3), [`daf7c13`](https://github.com/DocuBook/docubook/commit/daf7c13a7a42e85be8a73730e949cd2bfcc3574d), [`63f60aa`](https://github.com/DocuBook/docubook/commit/63f60aa5bd8faac43cdb5a1a037ad762d2ad70fc), [`a3f1f1b`](https://github.com/DocuBook/docubook/commit/a3f1f1bfe4103999eaf6df46382be3f36d474431)]:
  - @docubook/flame@2.6.0

## 0.1.1

### Patch Changes

- [#480](https://github.com/DocuBook/docubook/pull/480) [`b29ab09`](https://github.com/DocuBook/docubook/commit/b29ab09fb661adc6f66df0d273c5fa4041ee4ecb) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - Ask AI no longer sends the search index with every question unless `askAi.indices` is set. Agent Studio rejects per-request indices when the agent's search tool is in `static` mode, so Ask AI answered every question with "Chat error … does not accept a per-request algolia.indices override" (HTTP 422). Without `indices`, the agent searches the indices configured on its tool. Set `askAi.indices` only for an agent whose search tool is in `dynamic` mode.
