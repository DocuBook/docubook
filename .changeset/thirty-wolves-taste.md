---
"@docubook/core": patch
---

Add `escapeMeta()` to `handleCodeExpandable` — prevent metadata injection in MDX-compiled JS.

- New `escapeMeta()` function escapes `</` as `\u003C/` (HTML spec script data state) and `` ` `${}` `"` `\` `` as JS backslash escapes.
- `normalizedLanguage` and `normalizedTitle` are now wrapped in `escapeMeta()` before being appended to `node.meta` as `dbLang()`/`dbTitle()`.
