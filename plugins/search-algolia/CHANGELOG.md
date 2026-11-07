# @docubook/plugin-search-algolia

## 0.1.3

### Patch Changes

- [#503](https://github.com/DocuBook/docubook/pull/503) [`f756952`](https://github.com/DocuBook/docubook/commit/f7569521429e887a92b8cef9c735f753ee33e532) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - Dock Ask AI in a separate box beside the documentation on desktop. Reserve space for the configured panel width, preserve the reading position, and show accessible, evenly spaced TOC dots with active sections and heading tooltips. Use compact navigation on narrow desktops while keeping Ask AI fullscreen on mobile. The compact navigation action explicitly closes Ask AI and restores the full sidebar with visible focus. Keep the mobile navigation drawer above the document and dismiss search and Ask AI when it opens.

- [#502](https://github.com/DocuBook/docubook/pull/502) [`4f552ef`](https://github.com/DocuBook/docubook/commit/4f552ef7ec1151bfd58cb56889d70e92b29191be) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - Make the Ask AI side panel fill the viewport below 1024px, including tablet screens and custom panel widths. Hide the expand action while the panel is fullscreen.
- Updated dependencies [[`4733c4b`](https://github.com/DocuBook/docubook/commit/4733c4b0e4240192b4087f9894fb8cd9f42e603e), [`620eda7`](https://github.com/DocuBook/docubook/commit/620eda7b4a01b4e1996a973b27033012044dbea4), [`bac0581`](https://github.com/DocuBook/docubook/commit/bac05815ce748e3e19b70bc4acd9a9206fa2abdb), [`f756952`](https://github.com/DocuBook/docubook/commit/f7569521429e887a92b8cef9c735f753ee33e532), [`0d8c42f`](https://github.com/DocuBook/docubook/commit/0d8c42fe414500f6660b8fb33015ad809047815a), [`22774fb`](https://github.com/DocuBook/docubook/commit/22774fb9e5bff2c27f9168e72868cb3313d6bce8), [`5665075`](https://github.com/DocuBook/docubook/commit/5665075c51a789e0ddda91563e1fd1b73f89ec7c), [`58db2aa`](https://github.com/DocuBook/docubook/commit/58db2aa071ab32d89dcb1cc2727fa036dcebe609)]:
  - @docubook/flame@2.7.0

## 0.1.2

### Patch Changes

- [#487](https://github.com/DocuBook/docubook/pull/487) [`b5a3310`](https://github.com/DocuBook/docubook/commit/b5a3310576293f87f4bcc5d41a2dd6c17e0e85de) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - Conversations in the Ask AI history can be removed again. The remove (×) button on each conversation was hidden: the Sidepanel reuses the search dialog's `.DocSearch-Hit-action-button`, which the dialog stylesheet hides outside a selected search hit, and the plugin loads both stylesheets. The plugin's stylesheet now shows the button in the conversation history.
- Updated dependencies [[`dffd7d2`](https://github.com/DocuBook/docubook/commit/dffd7d294dd892df346b1fe9db5f2b032cd84bf3), [`daf7c13`](https://github.com/DocuBook/docubook/commit/daf7c13a7a42e85be8a73730e949cd2bfcc3574d), [`63f60aa`](https://github.com/DocuBook/docubook/commit/63f60aa5bd8faac43cdb5a1a037ad762d2ad70fc), [`a3f1f1b`](https://github.com/DocuBook/docubook/commit/a3f1f1bfe4103999eaf6df46382be3f36d474431)]:
  - @docubook/flame@2.6.0

## 0.1.1

### Patch Changes

- [#480](https://github.com/DocuBook/docubook/pull/480) [`b29ab09`](https://github.com/DocuBook/docubook/commit/b29ab09fb661adc6f66df0d273c5fa4041ee4ecb) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - Ask AI no longer sends the search index with every question unless `askAi.indices` is set. Agent Studio rejects per-request indices when the agent's search tool is in `static` mode, so Ask AI answered every question with "Chat error … does not accept a per-request algolia.indices override" (HTTP 422). Without `indices`, the agent searches the indices configured on its tool. Set `askAi.indices` only for an agent whose search tool is in `dynamic` mode.
