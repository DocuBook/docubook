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
- **Single-bundle delivery**: removed `splitting: true` from `Bun.build` and esbuild — mermaid and all deps bundled into one entry file (~4.3 MB resource, ~1 MB gzip transferred). Eliminates chunk waterfall, maximizes compression ratio (mermaid DSL strings are highly repetitive), and ensures instant navigation from cache after first load. Best trade-off for docs sites where users navigate across many pages.
- `<link rel="modulepreload">` added for JS — browser discovers and compiles the module ahead of `<script>` execution, parallel with HTML/CSS
- `<link rel="preload" as="style">` added for CSS — stylesheet discovered before HTML parsing completes
- Mermaid bundled eagerly in the single bundle; client-side lazy rendering deferred via IntersectionObserver (no `React.lazy`/`<Suspense>`, preventing content flash and bundler contradiction)
- `mdx-content` registry: eager `MermaidMdx` import; tsup `splitting` removed to align with flame single-bundle strategy
- Removed `/assets/chunks/*` `_headers` rule — chunks no longer emitted under single-bundle strategy
- Tailwind CSS build cached by content hash — skips subprocess when `globals.css` unchanged
- Lucide icons tree-shaken via esbuild virtual module — only used icons bundled

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
