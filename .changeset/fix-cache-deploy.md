---
"@docubook/flame": patch
---

Fix stale output from incremental builds and make the GitHub Pages workflow match the project's package manager on every runtime.

- A `docu.json` edit that does not touch the theme or `meta.basePath` (a sidebar title, the navbar text, the repo URL) now rebuilds the client bundle and re-renders every page. Before, every page was a cache hit and the bundle kept the old config until `flame build --force`. The resolved config is now part of the cache key (`BUILD_CACHE_VERSION` 9).
- Pages whose source was deleted or renamed are removed from the build output, along with their cache entries, and the build lists them. Before, their HTML stayed published with stale navigation.
- `flame deploy` under Bun wrote a Bun-only workflow (`bun install`) even for npm, pnpm and yarn projects. Both runtimes now write the same package-manager-aware workflow. Bun projects with a lockfile now install with `--frozen-lockfile`.
- The pnpm workflow passes a `version` to `pnpm/action-setup` when `package.json` does not declare pnpm in `packageManager` or `devEngines.packageManager`, which the action requires. It pins the major of the pnpm that ran `flame deploy`, or `latest`.
