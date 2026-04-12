---
"@docubook/core": patch
---

feat (core) : @docubook/core@1.4.1 ;

- Added utils.ts to export interface ElementNode extends Node
- Removed duplicated local interface Element definitions
- Added countCodeLines(raw: string) helper (CRLF normalization + newline edge handling).
- Updated packages/core/src/extract.ts:90 throw explicit error with original reason
- Added explicit returns in the plugin transformers inside packages/core/src/compile.ts
