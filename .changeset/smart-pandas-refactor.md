---
'@docubook/flame': patch
---

Use SHA256 instead of MD5 for Tailwind cache key in hydrate

- `hydrate.ts` / `hydrate.node.ts`: MD5 → SHA256 for content-addressable cache key (consistency with build path)
