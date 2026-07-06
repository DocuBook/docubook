---
"@docubook/mdx-content": patch
---

Fix d3-selection `dispatchEvent` TypeError from overlapping mermaid renders: serialize `mermaid.run()` calls, skip theme-sync re-renders when the theme is unchanged, guard against detached nodes, and catch theme-sync render failures with a console warning.
