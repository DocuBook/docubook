---
"@docubook/flame": patch
---

Fix two `flame deploy` flags.

- `--silent` now prints nothing on Node and Deno when the deploy succeeds, as it already did on Bun. The in-process build used to print the Vite chunk report and the progress spinner, over a hundred lines. Build errors are still shown, and the exit code is unchanged.
- The progress spinner now follows `LOG_LEVEL` and `LOG_FORMAT=json` like the rest of the logger. It is quiet when info messages are filtered out, and it writes JSON entries instead of terminal control codes in JSON mode.
- `--ci` without `--docker` used to be ignored without a word. flame now warns that `--ci` only applies with `--docker`, even under `--silent`, and points to `flame deploy --docker --ci`.
