---
'@docubook/flame': minor
'@docubook/mdx-content': patch
---

**`--docker` + `--silent` flags**, nginx hardening, bundle optimizations, security fixes

### New features
- `flame deploy --docker` — generates Dockerfile (multi-stage, nginx:alpine), nginx.conf, .dockerignore
- `flame deploy --docker --silent` — suppresses non-essential output, keeps errors only
- `/docs/assets/` nginx location with 7d cache (vs 1y immutable for `/assets/`)
- CSP (`Content-Security-Policy`) now included in all static HTML builds via `<meta>` tag
- nginx config includes security headers (`X-Frame-Options`, `HSTS`, etc.) in all location blocks

### Performance
- Tailwind CSS build cached by content hash — skips subprocess when `globals.css` unchanged
- Lucide icons tree-shaken via esbuild virtual module — only used icons bundled
- Mermaid lazy-loaded on client via `React.lazy()` — split from main bundle (-36KB)
- `mdx-content` registry: Mermaid lazy on client, eager on SSR; tsup `splitting: true` enabled
- `hydrate.ts` (Bun) and `hydrate.node.ts` (esbuild) aligned: removed dead `splitting` config

### Security
- Stack trace hidden in production error pages
- `isPathSafe`, `isSlugSafe`, `injectNonce`, `cspHeader` now tested (31 tests)
- Security penetration test suite added (32 tests, OWASP A02/A03/A05)
- Empty catch in `scanDirLucideIcons` now logs warning instead of swallowing

### Housekeeping
- `HtmlShellOptions` interface single-sourced in `html.shared.ts`
- `HEADERS_FILE` constant single-sourced in `deploy.shared.ts`
- All test files import from `html.shared.ts` instead of Bun-only `html.ts`
- Deploy tests import actual constants instead of hardcoded copies
