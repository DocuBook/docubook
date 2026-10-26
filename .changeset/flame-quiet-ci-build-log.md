---
"@docubook/flame": patch
---

Quieter `flame build` output on Node and Deno. The client bundle no longer prints a multi-line Rolldown `MODULE_LEVEL_DIRECTIVE` warning for every `"use client"` component, or for the empty `''` statements in the MDX toolchain. Both are meaningless in a browser-only bundle. Building without git history (no `.git` in the CI checkout, a repository with no commits yet, or git not installed) no longer dumps the full page list and a stack trace. Page dates fall back to file mtime silently, and build no longer spawns a failing `git log` for each page. Other git failures are reported in one line.
