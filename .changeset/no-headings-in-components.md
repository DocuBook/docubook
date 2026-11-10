---
"@docubook/core": patch
"@docubook/flame": patch
---

Components no longer render headings. A `#`…`######` line inside a callout, card, tab, accordion, step or GitHub alert used to become a real `<h1>`–`<h6>` with an anchor link and, for h2–h4, a table-of-contents entry. That put a second h1 on the page, and a heading in a hidden tab or a collapsed accordion became a TOC link to content the reader could not see. Such a line now renders as a plain paragraph that keeps its text and inline markup, through the new `remarkComponentHeadings` plugin in the default remark stack. The built-in search index follows the same rule: a heading inside a component is indexed as content of the section around it instead of as its own section, and `:::` fence lines are no longer indexed as text.
