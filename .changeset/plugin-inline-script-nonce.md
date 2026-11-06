---
"@docubook/flame": patch
---

Plugins can now run inline scripts on the deployed site. `PageContext` has a new `nonce` field, the page's CSP nonce: write `<script nonce="${ctx.nonce}">` in `injectHead` or `injectBody`. Before, the page's Content Security Policy blocked every inline plugin script, even though `flame preview` ran them. Flame does not add the nonce to plugin output itself, so a `<script>` that reaches the page through an unescaped value stays blocked. `flame preview` now only replaces the nonce the build wrote, so it blocks the same scripts as the deployed site.
