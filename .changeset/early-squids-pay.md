---
'@docubook/flame': patch
---

Fix git date fallback and Docker/Vercel deployment dates

- Add `getFilesystemMtime()` fallback in `git.ts` — when git is unavailable
  (shallow clone, no `.git`), dates fall back to filesystem mtime instead of
  `undefined`. The chain is now: `frontmatter.date` → `git log` → `mtime`.
- Remove `.git` from `.dockerignore` — Docker builds now include git history,
  enabling correct last-modified dates via `git log`.
- Document `VERCEL_DEEP_CLONE=true` in deployment docs — Vercel's default
  shallow clone prevents `git log` from resolving per-file dates.
