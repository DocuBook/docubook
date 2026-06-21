---
"@docubook/flame": patch
---

fix(flame): add security headers to plugin handleRequest + fix dev server asset depth

- Plugin `handleRequest` responses now auto-inject security headers
  (`Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`) and `Content-Security-Policy` for
  HTML responses. Plugin's own headers take precedence over defaults.
- Dev server now passes correct `depth` to `htmlShell`, fixing broken
  CSS/JS asset paths on nested docs pages (e.g. `/docs/getting-started/introduction`
  was requesting `assets/client.css` → wrong path instead of `../../assets/client.css`).
