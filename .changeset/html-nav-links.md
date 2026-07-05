---
"@docubook/flame": patch
---

fix(flame): append `.html` to generated internal navigation links (sidebar, pagination, context switcher, search index, landing feature cards) so they resolve on static hosts without clean-URL rewriting; the dev server normalizes `/docs/*.html` requests back to their extensionless routes
