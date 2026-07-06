---
"@docubook/flame": patch
---

Load the client bundle with `<script type="module">`. The bundle is built as ESM; executing it as a classic script leaked top-level declarations onto `window`, letting d3-hierarchy's `Node` constructor clobber the browser's `Node` global. DOMPurify then failed to resolve `Node.prototype.nodeName` and every `mermaid.run()` rejected in the dev server, showing the "Diagram rendering error" fallback instead of diagrams. Production was unaffected only because minification renames top-level symbols.
