---
"@docubook/plugin-search-algolia": patch
---

Conversations in the Ask AI history can be removed again. The remove (×) button on each conversation was hidden: the Sidepanel reuses the search dialog's `.DocSearch-Hit-action-button`, which the dialog stylesheet hides outside a selected search hit, and the plugin loads both stylesheets. The plugin's stylesheet now shows the button in the conversation history.
