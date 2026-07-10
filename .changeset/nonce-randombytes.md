---
'@docubook/flame': patch
---

fix(security): replace randomUUID with randomBytes for stronger CSP nonce

- Use `crypto.randomBytes(16).toString("base64")` instead of `crypto.randomUUID()`
- Provides full 128-bit entropy (vs 122-bit UUID v4) and shorter nonce string
