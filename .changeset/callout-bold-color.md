---
"@docubook/markdown": patch
---

Keep `**bold**` inside a callout in the callout's own color. The typography styles painted it in the page's ink color (near black, or white in dark mode) on the tinted panel, so it ignored the type's color token. Bold in a callout now inherits that color and stands out by weight instead, raised from 600 to 700.
