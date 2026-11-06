---
"@docubook/flame": minor
---

Add `meta.verification` to `docu.json` for site-verification tags. Each entry, keyed by meta name, becomes a `<meta>` tag in the `<head>` of every page Flame builds, including the landing page, so the Algolia Crawler or Google Search Console can verify your domain: `{ "algolia-site-verification": "ADCCB4B3D3A8BDCE" }` renders `<meta name="algolia-site-verification" content="ADCCB4B3D3A8BDCE">`.
