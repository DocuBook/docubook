---
"@docubook/flame": patch
---

Add sanitization warning and runtime type guard for injectHead/injectBody plugin hooks

- Add JSDoc `⚠️` sanitization warning on `injectHead` and `injectBody` methods
  in PluginBuilder interface
- Add runtime type guard in `collectBody` and `collectHead` to validate return
  values are `string | string[]`, rejecting non-strings with `console.warn`
