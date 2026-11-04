---
"@docubook/flame": patch
---

The optional `@sentry/bun` peer dependency now accepts v11 as well as v10 (`^10.0.0 || ^11.0.0`), so installing `@sentry/bun@11` next to flame no longer prints an unmet peer warning. Error tracking (enabled by `SENTRY_DSN`) uses only `init` and `captureException`, which v11 keeps unchanged. Sentry v11 needs Node 20.19 or later.
