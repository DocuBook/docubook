---
"@docubook/markdown": patch
---

Keep the `"use client"` directive on interactive components. The package now ships one file per module instead of a single `dist/index.js` bundle, so React Server Components frameworks such as the Next.js App Router treat Accordion, Tabs, Tooltip, Mermaid and the other interactive components as client components. The public entry point is unchanged.
