---
"@docubook/flame": minor
---

Add `experimental.pages` to `docu.json`: bring your own landing page and keep everything Flame builds under `meta.basePath`.

With the flag on, the build writes no landing page and no landing bundle, and the `home` section is ignored with a warning. The 404 page stays Flame's and moves to `<basePath>/404.html`. Hashed bundles, the asset manifest and the search index move from the dist-root `assets/` to `<basePath>/_flame/`, so they never collide with an app's own `/assets/`. One route rule for the docs prefix then serves the docs next to any other app on the same origin, by merging the outputs or by a host rewrite. Stale output from a build with the other setting is cleaned up, and the flag is part of the build cache key.

`flame dev` and `flame preview` redirect `/` to the docs prefix; at a root deployment (`"basePath": ""`) the docs index owns `/`. `flame deploy --docker` generates an nginx config that redirects `/` to the docs and serves the prefixed 404. `flame deploy` for GitHub Pages builds with `FLAME_STANDALONE=1`, which adds a root redirect and a root 404 to the artifact. Both warn when a kept `nginx.conf` or workflow predates the flag.

A root `meta.basePath` (`""` or `"/"`) next to the flag puts the docs index, `404.html` and every page at the dist root, so it cannot share the origin with another app. The build and dev server warn about that combination, and the `docu.json` schema rejects it in the editor; a docs-only site that wants no landing page still builds.

Plugins receive the bundle directory as `assetsDir` in the `onEnd` context. Resolve `assetManifest` entries against it instead of a hard-coded `outDir/assets`, which no longer holds the bundles under the flag.

Type change for TypeScript plugins: `AssetManifest.home` is now optional, because no landing bundle is built under the flag. Code that reads `assetManifest.home.css` stops compiling under `strictNullChecks`, even with the flag off; null-check it (`assetManifest.home?.css`).

Independently of the flag, a whitespace-only `meta.basePath` such as `" "` is now a build error instead of being read as the deployment root. Set `""` or `"/"` for a root deployment.

The flag is off by default: existing projects keep the same output layout and page content until they opt in. Only the client bundle changes, so its hashed file names change once, as with any release that touches client code.
