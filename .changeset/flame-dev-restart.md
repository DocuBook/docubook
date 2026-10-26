---
"@docubook/flame": patch
---

`flame dev` in a workspace checkout now restarts itself when a linked `@docubook/*` package is rebuilt (for example by its `vite build --watch`), so server rendering and the browser bundle pick up the new code together. The previous component watcher never started. Open pages now wait for a restarting dev server and reload once it answers, instead of reloading after a fixed 2 seconds. Projects that install flame from npm keep a single-process dev server; set `FLAME_DEV_SUPERVISE=0` to opt out.
