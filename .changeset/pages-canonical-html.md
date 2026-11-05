---
"@docubook/flame": patch
---

Canonical URLs now work on GitHub Pages.

Canonical and `og:url` tags were extensionless (`…/docs/guide/routing`). GitHub Pages serves files by exact path, so every one of them 404ed there. `flame deploy`, which targets GitHub Pages, now builds with `FLAME_DEPLOY_TARGET=github-pages`, both in the generated workflow and when run locally, and docs pages then get `.html` canonical URLs. The docs index and the landing page keep their directory URLs. Every other build, `flame deploy --docker` included, stays extensionless, which is what clean-URL hosts serve. Nothing changes in `docu.json`: clean URLs are a platform setting.

The deploy target is part of the page cache key, so switching between `flame build` and `flame deploy` re-renders pages. `flame deploy` warns when a kept workflow from an older Flame lacks the variable. The signal is separate from `FLAME_STANDALONE`, which stays scoped to `experimental.pages`.
