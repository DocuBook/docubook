---
"@docubook/flame": patch
---

A plugin's `onLoad` handler now runs on every matching file when its `filter` has the `g` or `y` flag. Before, `RegExp#test` resumed from the previous match, so every other matching file skipped the handler and was built from its unchanged source. A filter that is not a `RegExp` now fails in `setup()` with `[plugin] onLoad requires a RegExp \`filter\``. The plugin docs now check required options in `setup()`, since an error thrown in `onStart` is only logged and the build continues.
