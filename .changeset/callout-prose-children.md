---
"@docubook/markdown": patch
---

Keep every part of a callout's text in the callout's own color. The typography styles also gave links, headings, inline code, blockquotes, definition terms, `kbd` and list markers the page's ink color (near black, or white in dark mode), so a URL in a callout showed as a black or white link on the tinted panel. They now inherit the callout color: links keep their underline in that color, and the borders of inline code, `kbd`, blockquotes and rules, plus the fill of inline code, are tints of it. Tables take their border, header color and header fill from new `--mdx-table-border`, `--mdx-table-head-color` and `--mdx-table-head-bg` variables, which fall back to the theme values; a callout sets them from its own color, so its tables follow it too. A code block inside a callout keeps the page's body color for its plain text instead of taking the callout color, so it looks the same as a code block outside a callout.
