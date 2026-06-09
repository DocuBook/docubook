# Security

> Identity, protection, and trust boundaries for DocuBook.

## Trust Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                    BUILD-TIME ONLY (Server/CI)                  │
│                                                                 │
│  • @docubook/core (MDX compilation)                             │
│  • fs-scanner (file system traversal)                           │
│  • search-indexer (content indexing)                            │
│  • *.server.ts files (react-router)                                 │
│  • docu.json reading & route resolution                         │
│  • Environment variables (SENTRY_DSN, GITHUB_TOKEN)             │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                    CLIENT BUNDLE (Browser)                      │
│                                                                 │
│  • @docubook/mdx-content components                             │
│  • UI components (DaisyUI / Radix)                              │
│  • Hydration entry (flame client.ts)                            │
│  • Search UI (client-side fuzzy / DocSearch widget)             │
│  • Theme toggle logic                                           │
│  • HMR EventSource (dev only)                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Rule:** No secrets, no file system access, no server-only logic crosses into the client bundle.

## HTTP Security Headers

Applied to all HTML responses across all frameworks:

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none'` | Prevent XSS, clickjacking |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Force HTTPS |
| `X-Frame-Options` | `DENY` | Prevent iframe embedding |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limit referrer leakage |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disable unused APIs |

### Implementation per Framework

| Framework | Mechanism |
|-----------|-----------|
| **Next.js** | `async headers()` in `next.config.mjs` |
| **flame** (Bun) | `SECURITY_HEADERS` constant + per-request `generateNonce()` → `cspHeader(nonce)` → `htmlResponse(html, nonce, status)` |
| **Vercel** | `"headers"` array in `vercel.json` |
| **react-router** | Middleware in server entry (planned) |

### Flame CSP Detail

Flame generates a unique cryptographic nonce (`crypto.randomUUID()`) per response via `cspHeader(nonce, allowEval)`:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{random}';
  style-src 'self' 'unsafe-inline';
  img-src 'self' https: data:;
  font-src 'self' data:;
  connect-src 'self' https:;
  frame-src https://www.youtube-nocookie.com;
  frame-ancestors 'none'
```

- **Nonce** is injected into the blocking theme script, client bundle script, and HMR script
- **`unsafe-eval`** is **conditional** — included only when `allowEval=true`, excluded in production builds
- Dev server passes `cspHeader(nonce, NODE_ENV !== 'production')` which enables `unsafe-eval` for HMR + MDX runtime eval
- Preview server passes `cspHeader(nonce, true)` — compiled MDX output (`next-mdx-remote`) requires runtime eval
- **`frame-src youtube-nocookie.com`** allows embedded YouTube videos
- **`connect-src https:`** allows HMR EventSource in development

### CSP Exceptions

| Exception | Reason | Framework | Scope |
|-----------|--------|-----------|-------|
| `unsafe-inline` (script) | Theme detection blocking `<script>` in `<head>` | flame | Production |
| `unsafe-eval` | MDX runtime evaluation (`next-mdx-remote`) | flame | Dev & preview — excluded in production builds only |
| `connect-src https:` | HMR EventSource in development | flame | Dev only |
| `frame-src youtube-nocookie.com` | Embedded YouTube videos | All | Production |

## Input Validation

| Surface | Validation | Implementation |
|---------|-----------|---------------|
| MDX content | Compiled at build time — no runtime eval of user input | Build-time only |
| URL slugs (flame) | `isSlugSafe(slug, docsDir)` — resolves slug safely within docs directory | `security.ts` — imported by `getDocsForSlug()` in `server.ts` |
| File paths (flame) | `isPathSafe(pathname, baseDir)` — guard against traversal (`..`) and URL-encoded traversal | `security.ts` — imported by `serveStatic()` in `server.ts` |
| Search queries | Client-side sanitization, server-side length limits | Search modal UI |
| docu.json | JSON Schema validation at build time | `docu.schema.json` |
| Git commands | Path sanitization — reject non-alphanumeric paths with `..` traversal | `getGitLastModified()` |

## Secrets Management

| Secret | Usage | Exposure |
|--------|-------|----------|
| `SENTRY_DSN` | Error reporting (opt-in via `@sentry/bun` optional peer dep) | Server-side only, never in client bundle |
| `ALGOLIA_APP_ID` | Search indexing | Public (search-only key) |
| `ALGOLIA_SEARCH_KEY` | Client search queries | Public (read-only) |
| `ALGOLIA_ADMIN_KEY` | Index management | CI only, never committed |

**Rules:**
- `.env.example` documents required variables without values
- `.env` files are gitignored
- No secrets in client-side code — verified by build-time tree-shaking (`.server.ts` suffix for react-router)

## Supply Chain Security

| Control | Implementation |
|---------|---------------|
| **Pinned package manager** | `packageManager: "pnpm@11.1.0+sha512..."` in package.json |
| **Engine requirement** | `engines.node: ">=20.0.0"` in root package.json |
| **pnpm strict mode** | Prevents phantom dependencies — packages can only import what they declare |
| **Lockfile integrity** | `pnpm-lock.yaml` committed, CI verifies `--frozen-lockfile` |
| **Dependency overrides** | Security patches via `overrides` field (e.g., `flatted>=3.4.2`, `postcss>=8.5.10`) |
| **Dependency audit** | `pnpm audit` in CI on every PR — blocks merge on critical/high |
| **Changeset review** | Package version bumps reviewed in PR process |
| **Conventional commits** | Commit message format enforced by commitlint |

## Plugin System Security (Planned)

Flame's plugin system loads third-party code into the build pipeline and dev server via `import()`. This introduces new trust boundaries.

### Threat Model

| Threat | Risk | Mitigation |
|--------|------|------------|
| Malicious plugin exfiltrates content | High — plugin sees all MDX content | Plugin author trust assumed (npm ecosystem); user configures plugins explicitly |
| Malicious plugin injects malicious HTML | High — `transformHtml`, `injectHead`, `injectBody` write to output | CSP nonces mitigate XSS even with plugin injection; HTML is static and served over HTTPS |
| Plugin accesses file system | Medium — plugin runs with process permissions | Same trust model as any Node.js dependency; plugins are explicit in `docu.json` |
| Plugin executes arbitrary code during build | Medium — build runs in CI environment | CI uses `--frozen-lockfile`; plugin versions pinned in `docu.json`; no dynamic plugin download |
| Plugin `handleRequest` in dev server | Low — exposes local dev server to custom routes | Dev server is local-only by default; `handleRequest` output is served to developer only |

### Security Boundaries

```
┌────────────────────────────────────────────────────────────┐
│                    Build / Dev Server                      │
│                                                            │
│  Plugin 1 ──► Plugin 2 ──► Plugin 3 (sequential chain)     │
│                                                            │
│  Each plugin runs within the same Node.js/Bun process      │
│  No sandbox, no isolation — plugins are trusted code       │
│  Plugin name + source must be explicit in docu.json        │
│  No remote plugin fetching — all plugins are local/NPM     │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                    Client (Browser)                        │
│                                                            │
│  Plugin output visible to end users:                       │
│  • injectHead / injectBody / transformHtml                 │
│  • All output goes through htmlShell CSP nonces            │
│  • Client bundles never include plugin code directly       │
└────────────────────────────────────────────────────────────┘
```

### Rules

1. **Plugins must have an explicit `name`** — unnamed plugins are rejected at load time
2. **Plugin source is explicit** — must be an npm package name or relative path in `docu.json`
3. **No remote/dynamic plugin loading** — all plugins are resolved at build start from declared packages
4. **Plugin execution is sequential** — no parallel execution that could cause race conditions
5. **Plugin errors fail the build** — prevents silent failures from reaching production
6. **CSP applies to plugin output** — `injectHead`/`injectBody` content passes through the same CSP nonce system as core HTML

## Authentication & Authorization

DocuBook is a **public documentation site** — no user authentication is required.

| Concern | Approach |
|---------|----------|
| Admin access | Git-based (push access = admin) |
| Deploy access | CI/CD pipeline credentials (GitHub Actions secrets) |
| Content editing | Pull request workflow |
| Rate limiting | CDN-level (Vercel/Cloudflare built-in) |
| Secrets in CI | GitHub Actions encrypted secrets, never in source |

## Error Handling & Information Leakage

| Layer | Behavior |
|-------|----------|
| **flame build** | MDX compilation errors show file path and error message in console; other pages still build; whole build exits with code 1 |
| **flame server** | 500 errors render styled HTML error page with sanitized message + stack trace; Sentry capture if enabled |
| **flame 404** | Pages not found render styled 404 page; throw Response in react-router |
| **Client bundle** | Errors caught in try/catch around React rendering; console.error with limited info |
| **CSP violation** | Browser reports (no `report-uri` currently — future enhancement) |

## Security-Triggered Defenses

| Defense | When | Implementation |
|---------|------|---------------|
| Path traversal guard | Every file read | `isPathSafe()` + `isSlugSafe()` from `security.ts` — used in `getDocsForSlug()` and `serveStatic()` in `server.ts` |
| File access boundary | Static file serving | `isPathSafe()` checks against `DIST_DIR` and `resolve(DOCS_DIR, "assets")` |
| Git command injection | Git date queries | `cleanPath` regex check: `^[a-zA-Z0-9\-_/.\s]+$` and no `..` path components |
| URL path traversal | Server routing | `pathname.startsWith()` checks before passing to file system |
