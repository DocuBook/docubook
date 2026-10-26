---
"@docubook/flame": patch
---

Fix module preloading for sites built with Node or Deno. The client bundle requested preloaded chunks from the site root (`/chunks/…`) instead of the assets directory, so every docs page fired dozens of 404 requests and lost chunk preloading. Bun builds were not affected.
