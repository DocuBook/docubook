---
"@docubook/core": patch
---

Add a `title="..."` fallback for code fence titles and harden AST handling so malformed MDX cannot break compilation.

### `@docubook/core` — feat

- **feat(core):** `preProcess` now reads a quoted `title` attribute from the fence meta, so ` ```python title="main.py" ` renders the same title as the existing ` ```python:main.py ` syntax. The meta string is never rewritten, keeping `showLineNumbers`, line ranges (`{1,3}`), and `Expandable` in their original order. Malformed values (unclosed quotes, empty title) are ignored so a typo does not break compilation.

### `@docubook/core` — fix

- **fix(core):** `preProcess` guards a missing `<code>` child and treats the first child as raw code only when it is a text node, so unusual code blocks no longer throw.
- **fix(core):** `remarkDirectiveToMdx` validates `children` before mapping, both at the root and on nested nodes, so directive conversion skips nodes without children instead of crashing.
- **fix(core):** `removeJavaScriptExpressions` checks for `children` before splicing and narrows MDX JSX attribute values instead of using unsafe `any` access.
- **fix(core):** `serialize` and `createFormattedMDXError` accept `unknown` errors and render a readable message when the thrown value is not an `Error`.
