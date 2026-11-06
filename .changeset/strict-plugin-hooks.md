---
"@docubook/flame": minor
---

`flame build` now fails when a plugin hook throws. Before, an error in `onStart`, `onLoad`, `transformFrontmatter`, `transformHtml` or `onEnd` was logged and the build exited with code 0, shipping pages without that hook's work, such as content an `onLoad` plugin was meant to remove. The build now exits with code 1, and a page whose hook failed is not written. The error names the hook and, for page hooks, the source file. `flame dev` still logs hook errors and keeps serving. If a plugin used to throw from a hook on purpose to report a soft problem, make it log a warning instead.
