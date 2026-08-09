---
"@docubook/core": major
"@docubook/flame": major
"@docubook/mdx-content": major
"@docubook/mdx-remote": major
"@docubook/runt": major
"@docubook/themes-colors": major
"@docubook/ui-react": major
---

**4.0.0 — unified versioning across all packages**

All DocuBook packages now share a single version and are released in lockstep
(enabled via a `fixed` group in `.changeset/config.json`). A changeset for any
package bumps every package to the same version.

This major release also ships breaking changes:

- Aligned all package versions to one shared number (`4.0.0`); individual
  package versions no longer diverge.

> **TODO (before merge):** list the actual breaking changes here — removed
> APIs, behavior changes, migration guidance, etc. This section will be written
> into the CHANGELOG of every package.
