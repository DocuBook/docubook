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
│  • *.server.ts files (rerouter)                                 │
│  • docu.json reading & route resolution                         │
│  • Environment variables (SENTRY_DSN, ALGOLIA_*)                │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                    CLIENT BUNDLE (Browser)                      │
│                                                                 │
│  • @docubook/mdx-content components                             │
│  • UI components (DaisyUI / Radix)                              │
│  • Hydration entry (flame client.ts)                            │
│  • Search UI (client-side fuzzy / DocSearch widget)             │
│  • Theme toggle logic                                           │
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
| **flame** (Bun) | `SECURITY_HEADERS` constant spread into Response for HTML |
| **Vercel** | `"headers"` array in `vercel.json` |
| **rerouter** | Middleware in server entry |

### CSP Exceptions

| Exception | Reason | Framework |
|-----------|--------|-----------|
| `unsafe-inline` (script) | Theme detection blocking script | flame |
| `unsafe-eval` | MDX runtime evaluation | flame (preview mode) |
| `connect-src https:` | HMR EventSource in development | All (dev only) |

## Supply Chain Security

| Control | Implementation |
|---------|---------------|
| **Pinned package manager** | `packageManager: "pnpm@11.1.0+sha512..."` in package.json |
| **Engine requirement** | `engines.node: ">=20.0.0"` |
| **pnpm strict mode** | Prevents phantom dependencies |
| **Lockfile integrity** | `pnpm-lock.yaml` committed, CI verifies `--frozen-lockfile` |
| **Dependency overrides** | Security patches via `overrides` field (e.g., `flatted>=3.4.2`, `postcss>=8.5.10`) |

## Secrets Management

| Secret | Usage | Exposure |
|--------|-------|----------|
| `SENTRY_DSN` | Error reporting (opt-in) | Server-side only, never in client bundle |
| `ALGOLIA_APP_ID` | Search indexing | Public (search-only key) |
| `ALGOLIA_SEARCH_KEY` | Client search queries | Public (read-only) |
| `ALGOLIA_ADMIN_KEY` | Index management | CI only, never committed |

**Rules:**
- `.env.example` documents required variables without values
- `.env` files are gitignored
- No secrets in client-side code — verified by build-time tree-shaking (`.server.ts` suffix)

## Input Validation

| Surface | Validation |
|---------|-----------|
| MDX content | Compiled at build time — no runtime eval of user input |
| URL slugs (flame) | `isSlugSafe()` — alphanumeric + hyphens only |
| File paths (flame) | `isPathSafe()` — no traversal (`..`), no absolute paths |
| Search queries | Client-side sanitization, server-side length limits |
| docu.json | Schema validation at build time |

## Authentication & Authorization

DocuBook is a **public documentation site** — no user authentication is required.

| Concern | Approach |
|---------|----------|
| Admin access | Git-based (push access = admin) |
| Deploy access | CI/CD pipeline credentials (GitHub Actions secrets) |
| Content editing | Pull request workflow |
| Rate limiting | CDN-level (Vercel/Cloudflare built-in) |

## Dependency Audit

| Tool | Frequency | Action |
|------|-----------|--------|
| `pnpm audit` | CI on every PR | Block merge on critical/high |
| Dependabot / Renovate | Weekly | Auto-PR for patch updates |
| Manual review | Monthly | Review new transitive dependencies |
