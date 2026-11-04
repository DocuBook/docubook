---
"@docubook/flame": patch
---

The optional `@sentry/bun` peer dependency now accepts v11 as well as v10 (`^10.0.0 || ^11.0.0`), so installing `@sentry/bun@11` next to flame no longer prints an unmet peer warning. Error tracking (enabled by `SENTRY_DSN`) uses only `init` and `captureException`, which v11 keeps unchanged. Sentry v11 needs Node 20.19+, 22.12+, or 23.2+ (Node 22.0–22.11 and 23.0–23.1 are not supported); stay on v10 if you are on an older Node release.
