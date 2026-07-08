---
"@docubook/flame": patch
---

Make plugin `onEnd` JSDoc and guide examples runtime-neutral: replace `Bun.write` with `node:fs/promises` `writeFile`, mark the callbacks `async`, and document that plugin hooks run on Bun, Node, and Deno.
