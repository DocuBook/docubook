---
"@docubook/flame": patch
---

`flame build` now rebuilds pages and the client bundle when a `@docubook/*` package it renders with changes. Before, upgrading `@docubook/markdown`, `@docubook/ui-react`, `@docubook/core` or `@docubook/themes-colors` without editing any MDX file kept serving pages and a bundle built from the previous version until `--force`. The build cache now includes a fingerprint of each package's built output. The first build after upgrading discards the existing `.docu/build-cache.json` once.
