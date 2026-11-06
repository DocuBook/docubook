---
"@docubook/flame": patch
---

Inline `<script>` tags that a plugin adds with `injectHead` or `injectBody` now get the page's CSP nonce, so they run on the deployed site. Before, the page's Content Security Policy blocked them, while `flame preview` ran them. `flame preview` now only replaces nonces the build wrote, so it blocks the same scripts as the deployed site. A `<script src>` from another host is still blocked: the policy only loads scripts from the site's own origin.
