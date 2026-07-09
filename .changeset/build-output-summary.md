---
"@docubook/flame": patch
---

Print a build output summary after a successful `flame build`: lists generated `dist` files with sizes, groups them by extension, and reports the total file count and distribution size. The format is color-free and identical under the Node and Deno runtime-smoke jobs, giving CI logs visibility into produced artifacts.