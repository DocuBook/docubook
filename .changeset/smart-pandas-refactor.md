---
'@docubook/flame': patch
---

Use SHA256 instead of MD5 for Tailwind cache key in hydrate; pass decoded pathname to isPathSafe

- `hydrate.ts` / `hydrate.node.ts`: MD5 → SHA256 for content-addressable cache key (consistency with build path)
- `server-routes.ts`: pass `decoded` instead of `pathname` to `isPathSafe()` (validate what you use)
