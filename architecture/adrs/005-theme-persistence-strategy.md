# ADR-005: Theme Persistence Strategy per Rendering Mode

## Status

Accepted (Updated 2026-06-06)

## Context

Dark/light theme must persist across page loads without Flash of Unstyled Content (FOUC). The solution depends on whether the framework has server-side access to user preferences.

DocuBook supports three rendering strategies:
- **flame (SSG)** — Static HTML, no server at runtime
- **Next.js (ISR/SSG)** — React Server Components, client hydration
- **react-router (SSR)** — Node.js server, full request/response cycle

## Decision

Use a different persistence mechanism per framework, optimized for its rendering model:

| Framework | Storage | Mechanism | SSR Access | FOUC Prevention |
|-----------|---------|-----------|------------|-----------------|
| **flame** (SSG) | `localStorage` | Blocking `<script>` in `<head>` + `prefers-color-scheme` CSS fallback | N/A — no server | Script runs before first paint, sets `dark` class on `<html>` |
| **Next.js** | `localStorage` | `next-themes` library + Tailwind `dark:` variant | N/A | `next-themes` handles class strategy + system preference + hydration guard |
| **react-router** (SSR) | Cookie | Read cookie in SSR loader → set `data-theme` attribute on `<html>` | Available in every request | Cookie read during SSR — correct theme rendered immediately, no flash |

### Flame Implementation Detail

```html
<!-- Blocking script in <head> — runs before any paint -->
<script nonce="{nonce}">try {
  if (localStorage.getItem("theme")==="dark")
    document.documentElement.classList.add("dark")
} catch(e){}</script>
```

- Uses `try/catch` to handle cases where `localStorage` is unavailable (private browsing, storage disabled)
- System preference handled via `prefers-color-scheme` CSS media query as fallback
- No cookie needed since there's no server to read it

### React-Router Implementation (Planned)

```typescript
// Loader reads cookie, passes theme to root component
export async function loader({ request }: LoaderFunctionArgs) {
  const cookie = request.headers.get("Cookie");
  const theme = parseThemeCookie(cookie); // "light" | "dark"
  return { theme };
}

// Theme toggle uses useFetcher() to set cookie without page reload
```

## Rationale

- **SSG (flame)**: No server request, so cookies are useless. A blocking script is the only way to prevent FOUC without a server round-trip.
- **SSR (react-router)**: Cookies are sent with every request, so the server can render the correct theme immediately. No client-side flash. This is the most elegant solution but requires a running server.
- **Next.js**: `next-themes` is the ecosystem standard. It handles edge cases (system preference, hydration mismatch, SSR guard) that would be costly to re-implement.

## Consequences

- flame requires `unsafe-inline` in CSP for the blocking theme script (mitigated by nonce-based CSP per ADR-006)
- react-router theme toggle uses `useFetcher()` to set cookie without full page reload
- Theme values must be consistent across frameworks (`"light"`, `"dark"`, with possible `"system"` support)
- flame supports system preference via CSS media query (no JS needed)
- If user has no stored preference, flame falls back to system default (no flash)
