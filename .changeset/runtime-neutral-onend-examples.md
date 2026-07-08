---
"@docubook/flame": patch
---

Make plugin `onEnd` JSDoc and guide examples runtime-safe: mark the callbacks `async`, guard `Bun.write` behind a `typeof Bun !== "undefined"` check with a `node:fs/promises` `writeFile` fallback, and document that plugin hooks run on Bun, Node, and Deno.
