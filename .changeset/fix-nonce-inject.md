---
'@docubook/flame': patch
---

fix(security): inject nonce into inline script tags in plugin HTML responses

- Store generated nonce and inject it into inline `<script>` tags via `injectNonce`
- Previously only CSP header had the nonce, causing inline scripts (theme toggle, etc.) to be blocked by CSP
