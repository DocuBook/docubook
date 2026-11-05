---
"@docubook/flame": patch
---

`engines.node` is now `^20.19.0 || >=22.12.0`, the range Vite 8 requires. Flame's Node and Deno paths build with Vite 8, so Node 20.11–20.18, which the old `>=20.11` range admitted, could not run them. Installing flame on one of those versions now prints an engines warning.
