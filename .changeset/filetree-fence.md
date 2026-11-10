---
"@docubook/core": minor
"@docubook/markdown": minor
---

Add the ```filetree fenced block for file trees. The body is an indented list: one entry per line, children indented further than their parent at any width, no connector characters. A fence keeps every leading space, which is what makes indentation alone enough; the legacy `::::tree` directive lost leading spaces in the markdown parser and needed `├─`/`│` connectors for every level. `@docubook/core` turns the fence into the `Tree` component through the new `rehypeFileTree` plugin, which runs in the default rehype pipeline; `title="…"` or `filetree:title` sets the tree's accessible label for screen readers and is not rendered.

The `Tree` component gets a refreshed look and behavior: mono rows with guide lines, folder and per-type file icons, muted notes for text after `#` or `//`, and the WAI-ARIA tree keyboard pattern (arrow keys, Home and End, Enter and Space) with a single tab stop. Empty folders written with a trailing `/` keep the folder icon. `::::tree` and its connectors still render through the same component.
