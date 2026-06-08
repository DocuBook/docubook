---
"@docubook/flame": patch
---

security(flame): conditional CSP with nonce injection for static preview

- `cspHeader(nonce, allowEval)` — `unsafe-eval` only in dev mode, excluded in preview/production
- `htmlResponse(html, nonce, status, allowEval)` — passthrough for allowEval
- Dev server passes `allowEval=true` for HMR + MDX runtime eval
- Preview server injects random nonces into static HTML inline scripts via `Bun.file().text()` before serving; CSP uses nonce + `unsafe-eval` for `next-mdx-remote`
- Extract `isPathSafe(pathname, baseDir)` and `isSlugSafe(slug, docsDir)` as exported utilities from `security.ts`; `server.ts` uses them instead of inline checks
- Update `architecture/security.md` Input Validation table and CSP detail sections to match actual implementation
