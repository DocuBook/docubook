---
"@docubook/flame": patch
---

Lazily compile `.docu/lib/` from `bin/cli.js` when it is missing on Node/Deno, so `FLAME_RUNTIME=node flame dev` works in a fresh monorepo clone without running `compile-lib` manually. `compile-lib.mjs` now stops the esbuild service so it also exits cleanly under Deno.
