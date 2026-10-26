---
"@docubook/flame": patch
---

Fix hydration of sites built with Node or Deno. The client bundle pulled in the server-side `client-routes` module (and with it `paths.ts` and Node built-ins) instead of the generated virtual module, so every page threw `resolve is not a function` on load and interactive components such as accordions and tabs stopped working. Bun builds were not affected.
