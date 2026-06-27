---
"@docubook/flame": patch
---

feat(security): validate transformFrontmatter return values

Add runtime type guard in `runTransformFrontmatterChain` to reject non-plain-object
return values from plugin callbacks (array, string, number) with a console warning.
Previously only `undefined` and `null` were filtered — invalid types could produce
`[object Object]` in rendered HTML.

Add runtime type guard for frontmatter `title` and `description` in build and
server pipelines — values that aren't strings now fall back to slug or empty
string instead of producing `[object Object]` or unexpected type coercion.
