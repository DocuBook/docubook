# ADR-005: Theme Persistence Strategy per Rendering Mode

## Status

Accepted

## Context

Dark/light theme must persist across page loads without Flash of Unstyled Content (FOUC). The solution depends on whether the framework has server-side access to user preferences.

## Decision

| Framework | Storage | Rationale |
|-----------|---------|-----------|
| **flame** (SSG) | `localStorage` + blocking `<script>` | No server — must read preference before paint |
| **Next.js** | `localStorage` via `next-themes` | Library handles class strategy + system preference |
| **rerouter** (SSR) | Cookie | Available in loader during SSR — no FOUC |

## Rationale

- **SSG (flame)**: No server request, so cookies are useless. A blocking script in `<head>` reads localStorage and sets the class before first paint.
- **SSR (rerouter)**: Cookies are sent with every request, so the server can render the correct theme immediately. No client-side flash.
- **Next.js**: `next-themes` is the ecosystem standard, handles edge cases (system preference, hydration mismatch).

## Consequences

- flame requires `unsafe-inline` in CSP for the blocking theme script
- rerouter theme toggle uses `useFetcher()` to set cookie without full page reload
- Theme values must be consistent across frameworks (e.g., `"light"`, `"dark"`)
