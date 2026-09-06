---
"@docubook/core": patch
"@docubook/flame": patch
"@docubook/markdown": patch
"@docubook/themes-colors": patch
"@docubook/ui-react": patch
---

Pre beta.4 — changes since `v2.0.0-beta.3`:

### `@docubook/flame` — fix

- **fix:** CSP — strip `frame-ancestors` from meta CSP, sync escaped CSP nonce for static preview
- **fix:** build cache — support index fallback, harden build cache
- **feat:** pagination — last page shows rich `prev` card with title + description from parse-once frontmatter registry (`toPaginationEntry()` DRY helper, no re-parse); paired `prev` stays minimal by design

### `@docubook/ui-react` — feat/fix

- **feat:** `PaginationDocs` prev-only variant — rich card (`title` + `description`, left-aligned, back-button layout) when prev stands alone (last page)
- **fix:** shared `PaginationCard` — next-only now renders `title`/`description` before the `Next` label (`metadata → divider → label`), prev stays `label → divider → metadata`
- **fix:** subpath declaration mapping — all `types` exports now point to `dist/base/*.d.ts` to match `tsc` output (`@docubook/ui-react/pagination` no longer `any`)

### repo — chore

- **chore:** update pnpm 12 and turbo
