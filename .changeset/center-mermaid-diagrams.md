---
"@docubook/markdown": patch
---

Center Mermaid diagrams that are narrower than the content column.

The diagram's `<pre class="mermaid">` was meant to shrink to the diagram and center itself. A host stylesheet that widens every `<pre>` defeats that, and flame's does, so the SVG sat at the start of the column. The `<pre>` now carries `data-mermaid-align="center"`, and `styles.css` centers the diagram's own `<svg>` with auto margins.

The rule moves only the SVG's outer box. It sets no `text-align`, which Mermaid's HTML labels would inherit. It also leaves the `<pre>` a plain block, so a Gantt chart still gets the full column width when Mermaid measures it.
