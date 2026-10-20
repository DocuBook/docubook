---
"@docubook/core": patch
---

Support `title="..."` as a code fence meta fallback for code block titles.

### `@docubook/core` — feat

- **feat(core):** `preProcess` now reads a quoted `title` attribute from the fence meta, so ` ```python title="main.py" ` renders the same title as the existing ` ```python:main.py ` syntax. The meta string is never rewritten, keeping `showLineNumbers`, line ranges (`{1,3}`), and `Expandable` in their original order. Malformed values (unclosed quotes, empty title) are ignored so a typo does not break compilation.
