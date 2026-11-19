---
"@docubook/markdown": patch
---

Stop drawing an empty body under a callout that has no content. A callout written as a leaf directive (`::tip{title="Heads up"}`) never takes children, but it still rendered an empty content box and kept the gap under its header. It now draws the header alone. A callout with content (`:::tip … :::`, or a GFM alert) is unchanged.
