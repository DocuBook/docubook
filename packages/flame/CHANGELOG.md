# @docubook/flame

## 1.6.6

### Patch Changes

- [#329](https://github.com/DocuBook/docubook/pull/329) [`a264e1a`](https://github.com/DocuBook/docubook/commit/a264e1a289fdfae3cc39a0c928a0ee8c14e37041) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - Fix git date fallback and Docker/Vercel deployment dates

  - Add `getFilesystemMtime()` fallback in `git.ts` — when git is unavailable
    (shallow clone, no `.git`), dates fall back to filesystem mtime instead of
    `undefined`. The chain is now: `frontmatter.date` → `git log` → `mtime`.
  - Remove `.git` from `.dockerignore` — Docker builds now include git history,
    enabling correct last-modified dates via `git log`.
  - Document `VERCEL_DEEP_CLONE=true` in deployment docs — Vercel's default
    shallow clone prevents `git log` from resolving per-file dates.

## 1.6.5

### Patch Changes

- [#326](https://github.com/DocuBook/docubook/pull/326) [`42cd700`](https://github.com/DocuBook/docubook/commit/42cd700d97ad75738d6ef48d51083b25095c2057) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - Fix Docker build: JSX runtime crash and missing git

  Two issues on Coolify/Docker deployment using `oven/bun:1`:

  1. **JSX runtime crash:** Bun v1.3.14 reads `NODE_ENV` at startup to select the JSX
     transform (`jsxDEV()` for dev, `jsx()` for production). Setting
     `process.env.NODE_ENV` programmatically in the CLI is too late — Bun has already
     initialized the JSX runtime. Fix: set `ENV NODE_ENV=production` in the Dockerfile
     and restore the `NODE_ENV=production` shell prefix in the project template so Bun
     sees it before startup.

  2. **Git not found:** `oven/bun:1` (Alpine) does not include git, which flame needs
     for file timestamps. Fix: switch base image to `oven/bun:1-debian` (Debian-based)
     which includes git and has a more compatible glibc for native binaries like esbuild.

  Changes:
  - `deploy.shared.ts`: `ENV NODE_ENV=production` in Dockerfile template
  - `deploy.ts`: same in DOCKERFILE_BUN template
  - `deploy.shared.ts`: `oven/bun:1` → `oven/bun:1-debian`
  - `deploy.ts`: `oven/bun:1` → `oven/bun:1-debian`
  - `deploy.test.ts`: update assertions for `1-debian`
  - `template/package.json`: restore `NODE_ENV=production` prefix on build/preview/deploy
  - `bin/cli.js`: restore `NODE_ENV=production` prefix for Deno scaffold

## 1.6.4

### Patch Changes

- [#324](https://github.com/DocuBook/docubook/pull/324) [`0910f0e`](https://github.com/DocuBook/docubook/commit/0910f0e52679764038fea61cf46801382e72f6de) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - Set `NODE_ENV=production` for build/preview/deploy to ensure minified client bundle

  The flame CLI did not set `NODE_ENV`, so `flame build` defaulted to development
  mode (no minification), producing a ~9MB client bundle instead of ~4.3MB.
  Platforms like Coolify run `bun run build` without setting NODE_ENV, causing
  production deployments to ship an unnecessarily large bundle.

  Changes:
  - `bin/cli.js`: set `process.env.NODE_ENV = "production"` for `build`, `preview`,
    and `deploy` commands when not already set
  - `build.impl.ts`: pin `cspHeader()` `allowEval` to `true` regardless of NODE_ENV
    — `@docubook/mdx-remote` uses `new Function(compiledSource)` for client-side MDX
    hydration, which requires `'unsafe-eval'` in CSP until that dependency is removed
  - `.env.example` (both monorepo and template): added `BUILD_CONCURRENCY`,
    `LOG_LEVEL`, `LOG_FORMAT`, `SENTRY_RELEASE` — both files now identical

## 1.6.3

### Patch Changes

- [#322](https://github.com/DocuBook/docubook/pull/322) [`4ac1ded`](https://github.com/DocuBook/docubook/commit/4ac1ded71edc15c74e6c743df04ea7bfeb744ad4) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - Remove `USER nginx` from Dockerfile template to prevent container crash

  The `USER nginx` directive causes nginx to fail creating cache directories
  (`/var/cache/nginx/client_temp`) with permission denied, killing the
  container immediately. Since the container only serves static HTML, no
  cache directories are needed — removing the directive lets the container
  run as root (default) while nginx worker processes still run as `nginx`.

## 1.6.2

### Patch Changes

- [#320](https://github.com/DocuBook/docubook/pull/320) [`73b44dc`](https://github.com/DocuBook/docubook/commit/73b44dc73efd63acb826199c4442b261d7f8a018) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - Fix client-routes.ts path resolution when installed from npm

  `client-routes.ts` used a static `import docuConfig from "../../docu.json"` which only
  resolves correctly inside the monorepo. When the package is installed from npm, the path
  resolves to `node_modules/@docubook/flame/docu.json` — a file not present in the published
  package — causing `flame build` to fail with `Cannot find module '../../docu.json'`.

  Changes:
  - `client-routes.ts`: replace static import with `loadDocuConfig()` from `./paths` (reads
    from the project root via `process.cwd()`)
  - `hydrate.ts` (Bun.build): `docu-config` plugin now intercepts `client-routes` (extensionless)
    and inlines the resolved config instead of intercepting `docu.json`
  - `hydrate.node.ts` (esbuild): same plugin update for the Node/Deno bundle path

## 1.6.1

### Patch Changes

- [#318](https://github.com/DocuBook/docubook/pull/318) [`f4bfd53`](https://github.com/DocuBook/docubook/commit/f4bfd53cf6a3e80eeb3115117629b2ee56f652ad) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - fix(flame): detect package manager by lockfile in deploy.shared.ts

  `detectPkgManager()` auto-detects `bun.lock`, `pnpm-lock.yaml`, `yarn.lock`,
  or `package-lock.json` and returns correct Dockerfile config (base image,
  install command, cache) and GHA workflow setup for each.

  `generateWorkflowYml()` follows production standard:
  - `actions/checkout@v7`, `actions/setup-node@v6` with `cache`
  - `pnpm/action-setup@v6` for pnpm, `oven-sh/setup-bun@v2` for bun

  DRY: extracted `NGINX_CONF` and `DOCKERIGNORE` to `deploy.shared.ts`,
  removed duplicate from `deploy.ts`.

## 1.6.0

### Minor Changes

- [#315](https://github.com/DocuBook/docubook/pull/315) [`4ec011d`](https://github.com/DocuBook/docubook/commit/4ec011dd709ba585924bcf92936855aaf27e5ed6) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - **`--docker` + `--silent` flags**, nginx hardening, bundle optimizations, security fixes

  ### New features
  - `flame deploy --docker` — generates Dockerfile (multi-stage, nginx:alpine), nginx.conf, .dockerignore
  - `flame deploy --docker --silent` — suppresses non-essential output, keeps errors only
  - `/docs/assets/` nginx location with 7d cache (vs 1y immutable for `/assets/`)
  - CSP (`Content-Security-Policy`) now included in all static HTML builds via `<meta>` tag
  - nginx config includes security headers (`X-Frame-Options`, `HSTS`, etc.) in all location blocks

  ### Performance
  - **Single-bundle delivery**: removed `splitting: true` from `Bun.build` and esbuild — mermaid and all deps bundled into one entry file (~4.3 MB resource, ~1 MB gzip transferred). Eliminates chunk waterfall, maximizes compression ratio (mermaid DSL strings are highly repetitive), and ensures instant navigation from cache after first load. Best trade-off for docs sites where users navigate across many pages.
  - `<link rel="modulepreload">` added for JS — browser discovers and compiles the module ahead of `<script>` execution, parallel with HTML/CSS
  - `<link rel="preload" as="style">` added for CSS — stylesheet discovered before HTML parsing completes
  - Mermaid bundled eagerly in the single bundle; client-side lazy rendering deferred via IntersectionObserver (no `React.lazy`/`<Suspense>`, preventing content flash and bundler contradiction)
  - `mdx-content` registry: eager `MermaidMdx` import; tsup `splitting` removed to align with flame single-bundle strategy
  - **Island hydration**: `toc-island` and `mdx-content-island` now hydrate via `hydrateRoot` (SSR matches client render). `sidebar-island` remains `createRoot` — SSR renders `<Menu>` only, client renders `<Sidebar>` (different structure), so hydration would mismatch. `mobile-bar-island` SSR div is empty, so `childElementCount` fallback routes to `createRoot` automatically.
  - Removed `/assets/chunks/*` `_headers` rule — chunks no longer emitted under single-bundle strategy
  - Tailwind CSS build cached by content hash — skips subprocess when `globals.css` unchanged
  - Lucide icons tree-shaken via esbuild virtual module — only used icons bundled

  ### Security
  - Stack trace hidden in production error pages
  - `isPathSafe`, `isSlugSafe`, `injectNonce`, `cspHeader` now tested (31 tests)
  - Security penetration test suite added (32 tests, OWASP A02/A03/A05)
  - Empty catch in `scanDirLucideIcons` now logs warning instead of swallowing

  ### Housekeeping
  - `HtmlShellOptions` interface single-sourced in `html.shared.ts`
  - `HEADERS_FILE` constant single-sourced in `deploy.shared.ts`
  - All test files import from `html.shared.ts` instead of Bun-only `html.ts`
  - Deploy tests import actual constants instead of hardcoded copies

### Patch Changes

- Updated dependencies [[`4ec011d`](https://github.com/DocuBook/docubook/commit/4ec011dd709ba585924bcf92936855aaf27e5ed6)]:
  - @docubook/mdx-content@3.4.5

## 1.5.4

### Patch Changes

- [#310](https://github.com/DocuBook/docubook/pull/310) [`3a9931e`](https://github.com/DocuBook/docubook/commit/3a9931e18de77475d6a5f27e59df8d0d96e614c8) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - Generate OpenGraph, Twitter Card, and canonical meta tags from existing config and frontmatter

  - Added `buildSeoMeta()` function in `seo.ts` that derives `og:title`, `og:description`, `og:url`, `og:type`, `og:site_name`, `twitter:card`, and canonical link from existing `docuConfig` and per-page frontmatter
  - Extended `HtmlShellOptions` with optional `seo` field in both `html.ts` and `html.shared.ts`
  - `htmlShell()` now renders OG + Twitter + canonical `<meta>` tags in `<head>` when `seo` is provided
  - Integrated into `renderDocsPage()`, landing page, and 404 page in both `build.ts` (Bun) and `build.impl.ts` (Node/Deno)

  Added `meta.ogImage` config field for a global OG image fallback. When a page's frontmatter has no `image`, `meta.ogImage` is used as `og:image`. The landing page, docs pages, and 404 page all benefit from this fallback.

  Default OG image assets added at `docs/assets/images/og.png` (1648×879) for both the framework docs and the init template.

  Fallback chain: `frontmatter.image` > `meta.ogImage` > undefined (no og:image tag).

  Added unit tests for `buildSeoMeta()` (16 test cases) and `htmlShell()` SEO output (10 test cases).

  ### ImageMdx: responsive image scaling
  - Changed `width: "100%"` to `maxWidth: "100%"` so images render at natural size up to the container width
  - Added `display: flex; justifyContent: center` to the wrapper button for centering small images
  - Large images (>container width) automatically scale down; small images stay at natural size

- Updated dependencies [[`3a9931e`](https://github.com/DocuBook/docubook/commit/3a9931e18de77475d6a5f27e59df8d0d96e614c8)]:
  - @docubook/mdx-content@3.4.4

## 1.5.3

### Patch Changes

- [#308](https://github.com/DocuBook/docubook/pull/308) [`f3c8244`](https://github.com/DocuBook/docubook/commit/f3c8244c2a9e6c7f2d9e7dc35762ab0ebf256f8c) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - Fix sidebar border overlap and content layout centering

  - **Separator mode**: level 1+ leaf items now use `-ml-[14px]` overlap wrapper so the active `border-primary` aligns at the ul's gray border edge, consistent with level 0 items
  - **Dropdown mode**: level 1+ items get `border-l-2` at their natural indented position with `border-base-300` (inactive) / `border-primary` (active) — no overlap, tree structure visible
  - **Dynamic overlap offset**: separator mode calculates accumulated offset based on nesting level (14px base + parent section padding per level), ensuring correct overlap at ul's edge for any depth
  - **Typography**: removed `max-w-[500px]!` constraint so content fills available width
  - **Content layout**: added centering wrapper (`2xl:mx-auto 2xl:max-w-[1300px]`) inside scroll-container so content + TOC stay centered on screens >1440px without shrinking the container
  - **Fallback and dropdown modes**: aligned with same `border-base-300` ul + `-ml-[14px]` item structure as separator mode for consistency
  - **DRY refactor**: extracted `renderBorderItem`, `navProps`, and `sharedUlClasses` in Menu.tsx to eliminate duplicated nav item rendering across modes

- [#309](https://github.com/DocuBook/docubook/pull/309) [`0d76dd7`](https://github.com/DocuBook/docubook/commit/0d76dd77ae21e541be1cae7b680db485287bb41d) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - GitHubLink: respect repo.edit flag to hide GitHub icon when edit is disabled

  `GitHubLink` component previously only checked whether a `repoUrl` prop was provided. When `repo.edit` was set to `false` in `docu.json`, the "Edit this page" link correctly disappeared, but the GitHub icon in the sidebar remained visible because `GitHubLink` was unaware of the edit flag.

  Now `GitHubLink` also checks `docuConfig.repo?.edit`, so both the edit link and GitHub icon are consistently hidden when editing is disabled.

- Updated dependencies [[`11c7167`](https://github.com/DocuBook/docubook/commit/11c7167ea8a064767bdddc3d53aac1aa1f21575b)]:
  - @docubook/themes-colors@1.0.2

## 1.5.2

### Patch Changes

- [#304](https://github.com/DocuBook/docubook/pull/304) [`0dd505a`](https://github.com/DocuBook/docubook/commit/0dd505a917bf547f33338c86f9ba8d8859fbb4ef) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - fix(security): inject nonce into inline script tags in plugin HTML responses

  - Store generated nonce and inject it into inline `<script>` tags via `injectNonce`
  - Previously only CSP header had the nonce, causing inline scripts (theme toggle, etc.) to be blocked by CSP

- [#302](https://github.com/DocuBook/docubook/pull/302) [`25499c7`](https://github.com/DocuBook/docubook/commit/25499c79c857aaed391990aafb724085ed212f23) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - fix(security): replace randomUUID with randomBytes for stronger CSP nonce

  - Use `crypto.randomBytes(16).toString("base64")` instead of `crypto.randomUUID()`
  - Provides full 128-bit entropy (vs 122-bit UUID v4) and shorter nonce string
  - Reset `initialized` flag when `@sentry/bun` dynamic import fails
  - Update nonce assertions in tests from UUID pattern to base64 pattern

## 1.5.1

### Patch Changes

- [#293](https://github.com/DocuBook/docubook/pull/293) [`e80009d`](https://github.com/DocuBook/docubook/commit/e80009d03dd7c33e0825ebc5c05def76fd749008) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - Rewrite `next-mdx-remote` as `@docubook/mdx-remote` (MPL-2.0)

  - New `@docubook/mdx-remote` package with `serialize()`, `compileMDX()`, and `<MDXRemote>` (RSC + client)
  - Default `blockJS:true` strips JS expressions; defense-in-depth sanitizer audits dangerous patterns in all modes
  - Fixes `_jsxDEV` / `_jsxs` crash by merging both `react/jsx-runtime` and `react/jsx-dev-runtime` into scope
  - Removes `useDynamicImport` from public API (no callers, missing `baseUrl`)
  - Removes dead `parsePositionFromMessage` code
  - Adds unit test coverage (serialize + sanitizer paths)

  Wire `@docubook/core` to consume the new local package instead of `next-mdx-remote`

  - Update imports in `compile.ts` to use `@docubook/mdx-remote/rsc`, `/serialize`, and the main entry
  - Bump `@11ty/gray-matter` to `^2.1.0`

  Remove unused Next.js adapter from `@docubook/mdx-content`

  - Deletes `src/adapters/next/` (ButtonMdx, CardMdx, ImageMdx, LinkMdx)
  - Removes `./next` export and `peerDependenciesMeta.next` from package.json
  - Cleans up tsup build config

  Drop `mdx-jsx-runtime` esbuild/Bun plugin from flame hydrate

  - Plugin was only needed for `next-mdx-remote`'s CJS jsx-runtime shim; our ESM package resolves natively

  Flame build improvements

  - Remove build summary feature (poor DX)
  - Fix runtime detection for Deno npm compat (`process.execPath.includes("deno")` before `typeof Bun`)
  - Generate `deno.json` with `nodeModulesDir: auto` on Deno scaffold
  - Update scaffold next-steps message with Deno freshness policy hint
  - Format `card.mdx` docs section headings + props table

  Stale doc updates

  - `packages/core/README.md`: replace `next-mdx-remote` → `@docubook/mdx-remote`
  - `packages/mdx-content/README.md`: remove `./next` subpath docs
  - `ARCHITECTURE.md`: replace `next-mdx-remote` → `@docubook/mdx-remote` (CSP note, hydration note)

- Updated dependencies [[`e80009d`](https://github.com/DocuBook/docubook/commit/e80009d03dd7c33e0825ebc5c05def76fd749008)]:
  - @docubook/core@1.8.2
  - @docubook/mdx-content@3.4.3

## 1.5.0

### Minor Changes

- [#276](https://github.com/DocuBook/docubook/pull/276) [`5289e7d`](https://github.com/DocuBook/docubook/commit/5289e7d1b41359bf5405043df9cf1129631c4e20) Thanks [@pullfrog](https://github.com/apps/pullfrog)! - Multi-runtime support: flame now runs on Node.js (>=20.11) and Deno in addition to Bun.

  - New `@docubook/runt` package: `RuntimeAdapter` interface with `bunAdapter`, `nodeAdapter` (streaming `http.createServer` bridge), and `denoAdapter`.
  - flame CLI detects the runtime (`FLAME_RUNTIME` override supported) and routes `dev`/`build`/`preview`/`deploy` to Bun-native or runtime-neutral entries; existing Bun code paths are unchanged.
  - Runtime-neutral modules: pure `escapeHtml` + shared HTML shell, `child_process`-based git helpers, esbuild client bundling, and `.docu/lib` precompiled JS generated at publish for Node/Deno execution.
  - `@docubook/core`, `@docubook/mdx-content`, `@docubook/themes-colors`: dists are now bundled with tsup, producing self-contained Node-ESM-compatible output.

### Patch Changes

- [#290](https://github.com/DocuBook/docubook/pull/290) [`401b8e5`](https://github.com/DocuBook/docubook/commit/401b8e5d00245cc3e83814216ea044001e17008d) Thanks [@pullfrog](https://github.com/apps/pullfrog)! - Print a build output summary after a successful `flame build`: lists generated `dist` files with sizes, groups them by extension, and reports the total file count and distribution size. The format is color-free and identical under the Node and Deno runtime-smoke jobs, giving CI logs visibility into produced artifacts.

- [#280](https://github.com/DocuBook/docubook/pull/280) [`6e5ab13`](https://github.com/DocuBook/docubook/commit/6e5ab1363ee27c72fe25ce201525172ac52765fd) Thanks [@pullfrog](https://github.com/apps/pullfrog)! - Lazily compile `.docu/lib/` from `bin/cli.js` when it is missing on Node/Deno, so `FLAME_RUNTIME=node flame dev` works in a fresh monorepo clone without running `compile-lib` manually. `compile-lib.mjs` now stops the esbuild service so it also exits cleanly under Deno.

- [#288](https://github.com/DocuBook/docubook/pull/288) [`5c3bcef`](https://github.com/DocuBook/docubook/commit/5c3bcef195a42bc01558d6112e3d0fb30e930a75) Thanks [@pullfrog](https://github.com/apps/pullfrog)! - Normalize esbuild importer paths before the lucide-react bypass whitelist check to prevent path-form bypass attempts.

  `hydrate.node.ts` matched `args.importer` against string suffixes
  (`/.docu/components/Lucide.tsx`, `/mdx-content/dist/`) without normalizing
  first. Unnormalized path forms esbuild might surface (Windows backslashes,
  `..`/`.` segments, redundant separators) could slip past or fail to match the
  allowlist. Add a `normalizeImporterPath()` helper (`resolve()` + backslash to
  forward-slash) in `security.ts` and apply it to `args.importer` before the
  whitelist check.

- [#286](https://github.com/DocuBook/docubook/pull/286) [`0822f3e`](https://github.com/DocuBook/docubook/commit/0822f3e8e49517b6a9f9627061ffd8115b7a422c) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - Reduce client bundle size for Node/Deno runtimes by tree-shaking lucide-react imports.

  Bun's `optimizeImports: ["lucide-react"]` tree-shakes barrel exports automatically.
  esbuild lacks an equivalent, so `import * as LucideIcons` bundled all ~1000+ icon
  components (~10 MB). Add an esbuild `onResolve` plugin that intercepts every
  `lucide-react` import and serves a virtual module re-exporting only the icons
  actually needed — automatically collected from flame's source tree and dependency
  dist directories via `scanDirLucideIcons()`, plus icons referenced in the user's
  `docu.json` (routes context, features, hero actions). This replaces the prior
  hardcoded `SOURCE_ICONS` list that was fragile to maintain.

  Also extract the `NODE_BUILTINS_RE` regex and `lucideRealEntry` resolver into
  module-level constants, and use the `entryPath` variable directly instead of
  recomputing `join(LIB_DIR, "client.ts")`.

- [#285](https://github.com/DocuBook/docubook/pull/285) [`32fce19`](https://github.com/DocuBook/docubook/commit/32fce19393df32cf6262abe1a2f38a22c2791067) Thanks [@pullfrog](https://github.com/apps/pullfrog)! - Reduce the client bundle size: enable ESM code splitting in both bundlers (Bun `hydrate.ts` and esbuild `hydrate.node.ts`) so dynamic imports like `mermaid` ship as separate on-demand chunks instead of inlining into the single entry file; select the entry output by `kind`/`entryPoint` rather than position. Restrict daisyUI to `light`/`dark` themes (via `@plugin "daisyui"`) instead of importing all ~35 built-in themes. Add immutable `Cache-Control` for hashed `/assets/*` in `vercel.json` and emit a `_headers` file from `flame deploy` for Netlify/Cloudflare Pages.

  Fix MDX component borders broken by collision between daisyUI v5's `--border` (border width `1px`) and the project's `--border` (HSL color for `--color-border`). DaisyUI's plugin sets `--border: 1px` on `:root` via `:where(:root)` in every theme block; MDX components use `hsl(var(--border, ...))` for inline border colors, so `--border` resolving to `1px` made `hsl(1px)` invalid and border-color invisible. Rename the project's CSS variable from `--border` → `--border-color` across `globals.css`, `@docubook/themes-colors` theme JSONs, theme fixtures, and all 19 `var(--border)` references in `@docubook/mdx-content` component sources. Also remove `--prefersdark` from the daisyUI plugin config.

  Safelist daisyUI dynamic class variants via `@source inline(...)` in `globals.css` so structural classes used by `@docubook/ui-react` components (collapse, breadcrumbs, modal, drawer, navbar, kbd, toggle, input, menu, label) are emitted by Tailwind v4 even though the ui-react package dist is absent and its source builds class names via template literals (`kbd-${size}`, `toggle-${color}`, etc.) that Tailwind cannot statically detect.

  Extract the duplicated `cleanOldBundles()` function—identical across both the Bun and esbuild hydration files—into the shared `paths.ts` module.

- [#281](https://github.com/DocuBook/docubook/pull/281) [`8cf3362`](https://github.com/DocuBook/docubook/commit/8cf33621de44ec5ba84b8818df1475242325e68f) Thanks [@pullfrog](https://github.com/apps/pullfrog)! - Make plugin `onEnd` JSDoc and guide examples runtime-safe: mark the callbacks `async`, guard `Bun.write` behind a `typeof Bun !== "undefined"` check with a `node:fs/promises` `writeFile` fallback, and document that plugin hooks run on Bun, Node, and Deno.

- Updated dependencies [[`5289e7d`](https://github.com/DocuBook/docubook/commit/5289e7d1b41359bf5405043df9cf1129631c4e20), [`32fce19`](https://github.com/DocuBook/docubook/commit/32fce19393df32cf6262abe1a2f38a22c2791067)]:
  - @docubook/runt@0.2.0
  - @docubook/core@1.8.1
  - @docubook/mdx-content@3.4.2
  - @docubook/themes-colors@0.10.3

## 1.4.4

### Patch Changes

- [#272](https://github.com/DocuBook/docubook/pull/272) [`64db22d`](https://github.com/DocuBook/docubook/commit/64db22dee3a7ce01bd80d67dae9d8c4af1dc1c70) Thanks [@pullfrog](https://github.com/apps/pullfrog)! - Load the client bundle with `<script type="module">`. The bundle is built as ESM; executing it as a classic script leaked top-level declarations onto `window`, letting d3-hierarchy's `Node` constructor clobber the browser's `Node` global. DOMPurify then failed to resolve `Node.prototype.nodeName` and every `mermaid.run()` rejected in the dev server, showing the "Diagram rendering error" fallback instead of diagrams. Production was unaffected only because minification renames top-level symbols.

- Updated dependencies [[`1f719b1`](https://github.com/DocuBook/docubook/commit/1f719b145035f01094b40e910df725bbc536742c)]:
  - @docubook/mdx-content@3.4.1

## 1.4.3

### Patch Changes

- [#267](https://github.com/DocuBook/docubook/pull/267) [`2f4cbd7`](https://github.com/DocuBook/docubook/commit/2f4cbd77a59a53b9531b8244477399a37159de1d) Thanks [@pullfrog](https://github.com/apps/pullfrog)! - fix(flame): append `.html` to generated internal navigation links (sidebar, pagination, context switcher, search index, landing feature cards) so they resolve on static hosts without clean-URL rewriting; the dev server normalizes `/docs/*.html` requests back to their extensionless routes

  - add `rehypeDocsHtmlLinks` rehype plugin to append `.html` to internal `/docs/` hrefs on markdown `[text](path)` links (`<a>` elements in HAST)
  - add `remarkMdxJsxDocsHtmlLinks` remark plugin to append `.html` to `href` attributes on MDX JSX components (e.g. `<Card href="/docs/…">`) at the MDAST phase, before the MDX compiler converts them to JavaScript
  - fix `stripDocsHtmlSuffix` in `utils.ts` to handle the `/docs.html` edge case in addition to `/docs/*.html`
  - fix `index.tsx` homepage to apply `.html` suffix to `home.features[].link` and `home.hero.actions[].link` for configured entries, using `isExternalUrl` to skip external URLs
  - move imports in `types.ts` to top of file (style fix)

## 1.4.2

### Patch Changes

- [#263](https://github.com/DocuBook/docubook/pull/263) [`d7b6aa9`](https://github.com/DocuBook/docubook/commit/d7b6aa9566fc618fb8c2192763ff15452b56def2) Thanks [@pullfrog](https://github.com/apps/pullfrog)! - Add GFM-style pan, zoom, and fullscreen controls to the `Mermaid` component.

  - Button cluster in the bottom-right corner once a diagram renders: pan up/down/left/right, zoom in/out (clamped 0.4×–4×), reset, and a fullscreen toggle — mirroring GitHub's mermaid viewer.
  - Fullscreen opens the diagram in a lightbox overlay; close it with the button or `Escape`.
  - Keyboard support on the focused diagram container: arrow keys pan, `+`/`-` zoom, `0` resets.
  - Interaction is button and keyboard driven only — mouse drag and scroll-wheel zoom are intentionally not intercepted, so page scrolling over diagrams keeps working.
  - New `panZoom` prop (default `true`) to opt out per diagram.

  **flame**: Tighter spacing in sidebar menu.
  - Reduced `gap-1.5` → `gap-0.5` on menu `<ul>` containers in `Menu.tsx`.
  - Reduced `py-1.5` → `py-1` on sublink items and children container in `Sublink.tsx`.

- Updated dependencies [[`d7b6aa9`](https://github.com/DocuBook/docubook/commit/d7b6aa9566fc618fb8c2192763ff15452b56def2)]:
  - @docubook/mdx-content@3.4.0

## 1.4.1

### Patch Changes

- [#253](https://github.com/DocuBook/docubook/pull/253) [`5b864e6`](https://github.com/DocuBook/docubook/commit/5b864e66d03117d408ad11ecdbb79090305eec10) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - ### `@docubook/mdx-content` — New `MermaidMdx` component

  **Feature**

  - Added `MermaidMdx` component for rendering [Mermaid.js](https://mermaid.js.org/) diagrams inside MDX content.
  - Supports all standard diagram types: `flowchart`, `sequenceDiagram`, `classDiagram`, `stateDiagram`, `gantt`, `pie`, `erDiagram`, `gitGraph`, `journey`, and more.
  - Diagrams are rendered **client-side only** — during SSR a `<pre class="mermaid">` placeholder is output instead.
  - **Lazy rendering** via `IntersectionObserver` — off-screen diagrams are only rendered when scrolled into view (200px margin), reducing initial paint cost.
  - **Theme synchronization** — listens to `<html class>` mutations via `MutationObserver` and automatically re-renders diagrams when the dark/light theme changes.
  - **Error fallback** — invalid Mermaid syntax shows the raw chart definition alongside an error message instead of silently failing.
  - Singleton dynamic import (`mermaid` loaded once per page regardless of diagram count).
  - Exported from `@docubook/mdx-content` and registered in the component registry.

  ### `@docubook/core` — New `rehypeMermaid` rehype plugin

  **Feature**

  - Added `rehypeMermaid` rehype plugin that transforms fenced ` ```mermaid ` code blocks into `<Mermaid chart="...">` JSX elements during MDX compilation.
  - This avoids JSX parse collisions caused by Mermaid's `{...}` (decision nodes) and `[...]` (label nodes) syntax when written inline as JSX.
  - Exported from `@docubook/core` for use in any framework adapter.

  ### `@docubook/flame` — Sidebar active-item highlight and Mermaid docs

  **Fix**

  - Active sidebar item now scrolls into view on page load (`scrollIntoView({ block: "nearest" })`).
  - Added Mermaid diagram types documentation page to the flame docs site.

- Updated dependencies [[`5b864e6`](https://github.com/DocuBook/docubook/commit/5b864e66d03117d408ad11ecdbb79090305eec10)]:
  - @docubook/mdx-content@3.3.0
  - @docubook/core@1.8.0

## 1.4.0

### Minor Changes

- [#251](https://github.com/DocuBook/docubook/pull/251) [`922242e`](https://github.com/DocuBook/docubook/commit/922242ee09df94ea83807565d92840e126c6baf7) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - Add `sidebar.context` configuration with two modes: "dropdown" (default) and "separator"

  **Schema & types:**
  - Add `sidebar` object to `docu.schema.json` with `context` enum `["dropdown", "separator"]`, default `"dropdown"`
  - Add `DocuSidebar` interface and optional `sidebar` field to `DocuConfig`

  **Separator mode components:**
  - New `SidebarGroupHeader` — renders icon (Lucide) + title for each context section
  - Separator branch in `Menu.tsx` — filters routes with `context`, renders headers + tree connector + nav items
  - `Context.tsx` returns `null` in separator mode (context switcher not needed)

  **Visual:**
  - Icon wrapped in styled span matching Context.tsx dropdown pattern
  - Padding aligned with level-0 Sublink items
  - Tree connector line (`border-l-2`) connecting section header to its items
  - Tight spacing between header and items

  **Backward compatible:**
  - Absent `sidebar` or `sidebar.context === "dropdown"` preserves existing behavior
  - Dropdown mode code path unchanged
  - Sublink.tsx behavior unchanged

  ***

  Expand `detectPlatformPath` platform support and improve `repo` schema

  **Platform detection (`node/helpers.ts`):**
  - Add explicit cases for `gitea.com` (Gitea Cloud) and `codeberg.org` (Forgejo)
  - Update JSDoc comment — fallback now described as "Gogs, Forgejo, or any self-hosted Gitea-compatible forge"
  - Previously only GitHub, GitLab, Bitbucket were explicit; all others fell through to GitHub-style fallback (incorrect for Gitea-based platforms)

  **Schema (`docu.schema.json`):**
  - `repo.url`: add `format: "uri"`, expand description to list all supported platforms, add `examples` for GitHub / GitLab / Bitbucket / Gitea / Codeberg
  - `repo.path`: add `pattern: \{filePath\}` for editor validation, expand description with format guide and auto-detect note, add `examples` covering root repo + monorepo + non-default branch for all platforms

  **Documentation (`README.md`):**
  - Add dedicated `### Repo & Edit Links` section with platform auto-detection table, property table, and three annotated override examples (monorepo, non-default branch, self-hosted GitLab on custom domain)
  - Update full config example — remove hardcoded `path` to reflect that it is optional for root repos

  **Tests:**
  - `helpers.test.ts`: add unit tests for `gitea.com` and `codeberg.org` in `detectPlatformPath` and platform integration loop (22 tests total)
  - `schema.test.ts`: add `docu.schema.json — repo.url field` and `docu.schema.json — repo.path field` describe blocks covering `format`, `pattern`, `examples`, and `description` content (22 schema tests total)

## 1.3.8

### Patch Changes

- [#249](https://github.com/DocuBook/docubook/pull/249) [`79c8d2e`](https://github.com/DocuBook/docubook/commit/79c8d2ee9aef56684c320c12554835b232fa547e) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - refactor: eliminate non-null assertions in plugin config handling

  Replace `!!docuConfig.plugins?.length` + `docuConfig.plugins!` pattern with
  explicit `docuConfig.plugins ?? []` default and `pluginsConfig.length > 0`
  in both build.ts and server.ts. Also fix `builder?: BuildPluginBuilder` param
  type to accept `null` explicitly, and replace `server.port!` with safe
  `server.port ?? PORT` fallback.

  - Removes unsafe non-null assertions (`!`) that could throw at runtime
  - Eliminates redundant `!!` double-negation
  - Keeps `const` semantics for builder variable
  - Ensures consistent plugin config handling across build + dev server

## 1.3.7

### Patch Changes

- [#247](https://github.com/DocuBook/docubook/pull/247) [`35f8e7b`](https://github.com/DocuBook/docubook/commit/35f8e7b154044ad7e70cb700bb739e8f84d80768) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - fix: validate PORT env var with `parseInt` and range check (1–65535)

  Replace naive `Number(process.env.PORT ?? 3000)` with `parseInt(..., 10)` plus integer and range validation. Invalid values fall back to port 3000.

  refactor: remove redundant `hasPlugins` check in plugin setup (server.ts + build.ts)

  `builder` is already `null` when `hasPlugins` is falsy (from `hasPlugins ? new BuildPluginBuilder(docuConfig) : null`), so the extra `hasPlugins &&` guard was unnecessary in both the dev server and static build paths.

## 1.3.6

### Patch Changes

- [#244](https://github.com/DocuBook/docubook/pull/244) [`dc9ed35`](https://github.com/DocuBook/docubook/commit/dc9ed352c8f4b4531f1f24d1ace06201b2a59eef) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - Security hardening: plugin specifier validation, path traversal defense-in-depth, and DRY refactor

  This changeset consolidates seven files worth of security fixes, type safety improvements, and code deduplication for the Flame dev server and plugin system.

  ### Security fixes
  - **Plugin specifier validation**: `resolveSpecifier()` now validates npm package names against the standard npm naming regex before passing to dynamic `import()`. Invalid specifiers (uppercase letters, spaces, special characters) throw a clear `[plugin-loader] Invalid plugin specifier` error instead of silently being passed to Bun's module loader. Path specifiers (relative/absolute) are unaffected.
  - **Path traversal guard in `getDocsForSlug()`**: Replaced `join()` + `startsWith(DOCS_DIR)` with `resolve()` + strict guard using `resolvedDocsDir + "/"`. This closes a bypass where a directory named similarly to `DOCS_DIR` (e.g. `/docs-extra`) could sneak past the old prefix check.
  - **Decode-before-validate in `serveStatic()`**: `decodeURIComponent()` now runs **before** `isPathSafe()`, ensuring encoded traversal sequences like `%2F` or `%252F` are fully decoded before the path safety check. Previously, validation ran on the raw encoded pathname, leaving a window for double-encoding attacks.
  - **Malformed URI graceful degradation**: `decodeURIComponent()` is now wrapped in try/catch. Malformed percent sequences (`%ZZ`, `%GG`) no longer crash the server — they return 404 instead.
  - **`/docs/assets/` prefix stripping**: Replaced `string.replace("/docs/assets/", "")` with `string.slice(prefix.length)`. The old approach matched the first occurrence anywhere in the string; `slice` strips exactly N characters from the start, which is semantically correct after a `startsWith` check has already passed.

  ### Type safety
  - **`PORT` environment variable**: Changed from `process.env.PORT ?? "3000"` (yielding a `string`) to `Number(process.env.PORT ?? 3000)` (yielding a `number`), matching `Bun.serve()`'s type expectation.
  - **Removed non-null assertions**: Replaced `server.port!` and `server.hostname!` with `server.port ?? PORT` and `server.hostname ?? "localhost"` — proper fallbacks instead of lying to the type checker.

  ### DRY refactor
  - **`wrapPluginResponse()` extracted**: The 13-line plugin response security header wrapping logic (applying `SECURITY_HEADERS` defaults + CSP for HTML responses) was duplicated between `server.ts` and `__tests__/server.test.ts`. Now lives as a single exported function in `security.ts` with a `PluginResponseLike` interface. Both the dev server and the test suite import from one source of truth.

  ### Documentation fixes
  - Corrected JSDoc on `PluginBuilder.remarkPlugins()` and `PluginBuilder.rehypePlugins()`: replaced ambiguous "Plugins from all plugins" with "Plugins from all registered callbacks".

  ### Test coverage

  Added 15 new tests across two test files:

  `plugin-loader.test.ts` (8 tests):
  - Invalid npm specifiers: uppercase, spaces, special characters
  - Valid npm specifiers: scoped, unscoped, dots, tildes

  `server.test.ts` (7 tests):
  - Decode-before-validate semantics for `serveStatic`
  - Malformed URI try/catch pattern
  - `slice` vs `replace` prefix stripping
  - Resolved path stays within `DOCS_DIR/assets`

## 1.3.5

### Patch Changes

- [#239](https://github.com/DocuBook/docubook/pull/239) [`68c5da0`](https://github.com/DocuBook/docubook/commit/68c5da08344a0f098ce91158268a9d4761e6c8a8) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - feat(security): validate transformFrontmatter return values

  Add runtime type guard in `runTransformFrontmatterChain` to reject non-plain-object
  return values from plugin callbacks (array, string, number) with a console warning.
  Previously only `undefined` and `null` were filtered — invalid types could produce
  `[object Object]` in rendered HTML.

  Add runtime type guard for frontmatter `title` and `description` in build and
  server pipelines — values that aren't strings now fall back to slug or empty
  string instead of producing `[object Object]` or unexpected type coercion.

## 1.3.4

### Patch Changes

- [#237](https://github.com/DocuBook/docubook/pull/237) [`0e46c0d`](https://github.com/DocuBook/docubook/commit/0e46c0da60dbc27c23f4b5defecc5eb4e6afb3c3) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - Add sanitization warning and runtime type guard for injectHead/injectBody plugin hooks

  - Add JSDoc `⚠️` sanitization warning on `injectHead` and `injectBody` methods
    in PluginBuilder interface
  - Add runtime type guard in `collectBody` and `collectHead` to validate return
    values are `string | string[]`, rejecting non-strings with `console.warn`

## 1.3.3

### Patch Changes

- [#235](https://github.com/DocuBook/docubook/pull/235) [`1bfd09b`](https://github.com/DocuBook/docubook/commit/1bfd09bbcd080f3bace573519b58bbfed4e3f855) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - fix(flame): add security headers to plugin handleRequest + fix dev server asset depth

  - Plugin `handleRequest` responses now auto-inject security headers
    (`Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`,
    `Referrer-Policy`, `Permissions-Policy`) and `Content-Security-Policy` for
    HTML responses. Plugin's own headers take precedence over defaults.
  - Dev server now passes correct `depth` to `htmlShell`, fixing broken
    CSS/JS asset paths on nested docs pages (e.g. `/docs/getting-started/introduction`
    was requesting `assets/client.css` → wrong path instead of `../../assets/client.css`).

## 1.3.2

### Patch Changes

- [#233](https://github.com/DocuBook/docubook/pull/233) [`3dfd18f`](https://github.com/DocuBook/docubook/commit/3dfd18f646d347c28c651075a6815a9c0cec7206) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - fix(html.ts): depth-aware relative asset paths for subfolder/static hosting

  - Add `depth` option to `HtmlShellOptions` interface and `htmlShell()` (default 0)
  - Compute `depthPrefix` and `assetPrefix` based on depth: `""` at root, `"../".repeat(depth)` for subdirs
  - Add `resolvePath()` helper to convert absolute paths (starting with `/`) to relative using depth prefix
  - Change CSS `<link>` href from `"/assets/${css}"` to `"${assetPrefix + css}"`
  - Change JS `<script>` src from `"/assets/${js}"` to `"${assetPrefix + js}"`
  - Change favicon `<link>` href from raw value to `resolvePath(favicon)` with conditional rendering (skip when empty)
  - Favicon fallback updated from `/favicon.ico` to `/docs/assets/images/favicon.ico` to match template scaffold location

  fix(build.ts): calculate and pass page depth to htmlShell

  - Compute `depth = slug.split("/").length` for docs pages, default `1` for index page
  - Pass `depth` to `htmlShell()` call in `renderDocsPage()`
  - Update favicon fallback for landing and 404 pages to `/docs/assets/images/favicon.ico`

  fix(Lucide.tsx): resolve TypeScript error with lucide-react Icon type

  - Add `as unknown as` intermediate cast for `LucideIcons` index access to satisfy stricter lucide-react 1.18 types

  fix(Search.tsx): correct Kbd size prop value

  - Change `size="s"` to `size="sm"` across 3 occurrences (KbdSize = `"xs" | "sm" | "md" | "lg" | "xl"`)

  fix(plugin.ts): add missing DocuConfig type re-export

  - Add `export type { DocuConfig }` so `plugin-builder.ts` can import it from `./plugin`

  fix(server-routes.ts): align inlineThemeCss field type

  - Change `inlineThemeCss: string` to `inlineThemeCss?: string` to match `computeInlineThemeCss()` return type

  fix(server.ts): add non-null assertions for DevServerContext

  - Add `server.port!` and `server.hostname!` since bun-types 1.3.14 defines these as `number | undefined` / `string | undefined`

  fix(package.json): add unified dependency and align react version

  - Add `"unified": "^11.0.0"` as direct dependency (was previously only a transitive dependency)
  - Bump `react` from `^19.0.0` to `^19.2.7` for consistent resolution with @docubook/ui-react
  - Bump `react-dom` from `^19.0.0` to `^19.2.7`

## 1.3.1

### Patch Changes

- [`470d311`](https://github.com/DocuBook/docubook/commit/470d3118dbd794d75d577acb3dcbae72feb37b9c) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - fix: upgrade @sentry/bun to v10 to resolve CVE-2026-53550 DoS vulnerability

## 1.3.0

### Minor Changes

- [#219](https://github.com/DocuBook/docubook/pull/219) [`c5bedc8`](https://github.com/DocuBook/docubook/commit/c5bedc8ee2b968d46b0b3e43fadad29a9c2dfe6f) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - Plugin system — 10 hooks, Bun `setup(build)` convention.
  - **New**: `plugin.ts` (types), `plugin-loader.ts` (resolve & load), `plugin-builder.ts` (10 registration + 10 execution methods)
  - **Modified**: `build.ts` (pipeline wiring: onStart → onLoad → transformFrontmatter → injectHead/Body → transformHtml → onEnd), `server.ts` (handleRequest), `html.ts` (head/body injection), `mdx.ts` (remark/rehype merge), `types.ts`, `docu.schema.json`
  - **75 tests**: unit (39), integration (8), loader (16), mdx (6), schema (6) — zero regression

  No-op when `plugins` is empty. Errors: fail-fast for build hooks, error-isolated for dev server.

### Patch Changes

- Updated dependencies [[`7e742c0`](https://github.com/DocuBook/docubook/commit/7e742c0cf845f0336170c25ca94bae815d9bf1c3)]:
  - @docubook/core@1.7.1

## 1.2.1

### Patch Changes

- [#216](https://github.com/DocuBook/docubook/pull/216) [`f0e67f3`](https://github.com/DocuBook/docubook/commit/f0e67f3a4a1b27d6702701f1663bc3da35d20d18) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - security(flame): conditional CSP with nonce injection for static preview
  - `cspHeader(nonce, allowEval)` — `unsafe-eval` only in dev mode, excluded in preview/production
  - `htmlResponse(html, nonce, status, allowEval)` — passthrough for allowEval
  - Dev server passes `allowEval=true` for HMR + MDX runtime eval
  - Preview server injects random nonces into static HTML inline scripts via `Bun.file().text()` before serving; CSP uses nonce + `unsafe-eval` for `next-mdx-remote`
  - Extract `isPathSafe(pathname, baseDir)` and `isSlugSafe(slug, docsDir)` as exported utilities from `security.ts`; `server.ts` uses them instead of inline checks
  - Update `architecture/security.md` Input Validation table and CSP detail sections to match actual implementation

- Updated dependencies [[`91099c1`](https://github.com/DocuBook/docubook/commit/91099c1be5f17063d151a1a5f1e0dce58b872a5a)]:
  - @docubook/themes-colors@0.10.1

## 1.2.0

### Minor Changes

- [#201](https://github.com/DocuBook/docubook/pull/201) [`4664e56`](https://github.com/DocuBook/docubook/commit/4664e56d5f4f7f604217c823b07320eda73e5621) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - feat: config-driven theme system with @docubook/themes-colors
  - Create `@docubook/themes-colors` package — 3 presets (default, freshlime, coffee), hex→HSL/OKLch converters, theme resolver, CSS generator
  - Add `themes.colors` in `docu.json` — preset name or custom hex (`{ "primary": "#FF5733" }`)
  - Rename config key `theme.colors` → `themes.colors` to avoid confusion with hero button `theme` prop
  - Remove dead `light?`/`dark?` props from `ThemeConfig` type
  - Inject theme CSS into Tailwind build — resolved theme appended to compiled globals.css
  - Add FOUC prevention — inline `<style>` with theme CSS variables in `<head>` before CSS bundle loads
  - Add `--theme` CLI flag — override theme via `FLAME_THEME` env var
  - Auto-generate syntax highlighting tokens from custom hex primary color (12 tokens × 2 modes)
  - Auto-generate dark daisyUI base colors (base-100/200) from primary via proper sRGB→linear→LMS→OKLab→OKLch pipeline
  - Fix dark daisyUI base hues per preset — freshlime, coffee no longer forced to blue hue 260
  - Extract duplicate theme CSS logic from `build.ts`/`server.ts` into shared `computeInlineThemeCss()`
  - Export `presetRegistry` — pre-built theme registry to replace 6 manual JSON imports
  - Extract test fixtures to `src/__fixtures__/themes.ts` — removes ~260 lines duplication across test files
  - Add proper color space conversion functions: `hslToRgb`, `rgbToOklch`, `hexToOklch`
  - Update template `docu.json` with `themes.colors` for new projects
  - 111 unit/integration tests

### Patch Changes

- Updated dependencies [[`4664e56`](https://github.com/DocuBook/docubook/commit/4664e56d5f4f7f604217c823b07320eda73e5621)]:
  - @docubook/themes-colors@0.10.0

## 1.1.0

### Minor Changes

- feat(flame): add home page hero and features configuration
  - Extend `docu.json` schema with `home.hero` and `home.features` sections
  - Create `Hero` component with name, text, tagline, image, and action buttons
  - Create `Features` component with icon, title, description, and optional link
  - Action buttons support primary, secondary, and ghost themes
  - Grid pattern background on feature cards with daisyUI primary color
  - Auto `target="_blank"` for external URLs in hero actions
  - Closes FLAME-003

- feat(flame): support lucide + social icons for hero.actions
  - Action icons resolve from lucide-react first, then fall back to social icon map
  - Exported `getSocialIcon` from Social.tsx to avoid duplication
  - Supports GitHub, Twitter, Discord, and other social brand icons

- feat(schema): align schema with docu.json logic and add external link auto-target
  - Added `additionalProperties: false` to all object definitions for strict validation
  - Removed unused `heroImage` definition from schema
  - Removed `target` property from heroAction (now auto-detected)
  - Updated template/docu.json with home section examples

### Patch Changes

- fix(flame): sanitize SVG pattern ID to remove spaces
  - Prevents invalid SVG pattern references caused by whitespace in IDs

- fix(flame): use primary color for grid pattern stroke
  - Grid pattern on feature cards now uses daisyUI primary color variable

- style(flame): add grid pattern background to feature cards
  - Added decorative SVG grid pattern behind feature card content

- refactor(flame): rename hero fields and add grid pattern to features
  - Aligned hero field names with docu.json schema
  - Integrated grid pattern styling into Features component

- refactor(flame): centralize Lucide icon handling and fix test mocks
  - Add Lucide.tsx component with getLucideIcon and renderLucideIcon helpers
  - Use import \* as LucideIcons for tree-shaking compatibility with Bun
  - Update Hero, Features, and Context components to use centralized helpers
  - Fix SVG patternId collision by using index instead of feature.title
  - Add aria-hidden to decorative SVG elements
  - Fix vitest mock setup for Bun.spawn with vi.spyOn

- fix(flame): add rel="noopener noreferrer" to external links
  - Security fix for tab-nabbing vulnerability in Hero component
  - Add rel="noopener noreferrer" to Hero action buttons for external links
  - Simplify isExternalLink regex pattern
  - Remove unused HeroAction.target and HeroImage types

## 1.0.1

### Patch Changes

- fix(flame): restore role menuitem and hover styling in mobile dropdown menu
  - Reverted missing `role="menuitem"` attribute on mobile nav dropdown items
  - Restored hover styling that was lost during refactor

- fix(flame): add progressive padding for nested sidebar items
  - Add padding-left 1rem for level 1 submenu items
  - Add padding-left 1rem for level 1 section with children
  - Change padding-left from pl-4 to pl-2 for level 1 items
  - Add more padding for level 3 and deeper items
  - Adjust level 2 padding to pl-4 for proper hierarchy progression
  - Extract shared `levelPadding` variable to avoid duplication

## 1.0.0

### Major Changes

- First stable release of @docubook/flame
  - Bun-native documentation framework with React, MDX, and filesystem routing
  - Lightweight SSR with client hydration for interactive islands
  - HMR support during development
  - Static build to pre-render all pages for deployment
  - 📦 ~57 kB packed, ~207 kB unpacked

### Patch Changes

- fix(flame): improve search indexing, error handling, and mobile navigation
  - Enhanced search indexer to preserve component text content
  - Corrected fuzzy search scoring bias for long words
  - Improved error handling throughout search pipeline

- fix(flame): handle MDX component load error explicitly
  - Added explicit error handling when MDX components fail to load
  - Prevents silent failures in the rendering pipeline

- test(flame): add unit and integration tests for search indexer
  - Added comprehensive test coverage for search functionality

- chore: remove rc tag from docs
  - Updated documentation to reflect stable release status

## 1.0.0-rc.1

### Patch Changes

- refactor(ui): migrate to flat structure, remove unused APIs, fix dropdown/pagination
  - Migrated @docubook/ui-react to flat component structure
  - Removed unused APIs and cleaned up exports
  - Fixed dropdown and pagination component behavior

- refactor(ui-react): fix cn utility, use client directives, trim pagination
  - Fixed `cn` utility for proper class merging
  - Added `"use client"` directives where needed
  - Streamlined pagination component

- chore(flame): release candidate
  - Marked as release candidate for 1.0.0 stable

## 1.0.0-beta.80

### Patch Changes

- refactor(flame): split pagination component and improve build performance
  - Extracted pagination into separate component for better code splitting
  - Improved build performance through component decomposition

- fix(flame): resolve concurrency bug, deduplicate MDX pipeline, add tests
  - Fixed race condition in concurrent MDX processing
  - Deduplicated MDX pipeline to prevent duplicate renders
  - Added test coverage for pipeline deduplication

- fix(flame): use relative href in fs-scanner to prevent route path duplication
  - Changed filesystem scanner to use relative paths
  - Prevents route paths like `/docs/docs/getting-started`

- fix(flame): use createRoot for sidebar/mobile-bar to resolve hydration mismatch
  - Replaced direct DOM manipulation with React `createRoot` for sidebar and mobile bar
  - Resolves hydration mismatch errors between server and client

- refactor(flame): code review improvements and security hardening
  - Security improvements from code review
  - Hardened input validation and path handling

## 1.0.0-beta.70

### Patch Changes

- fix(flame): resolve sidebar not rendering when routes are empty
  - Sidebar now renders with auto-generated routes from filesystem when `routes: []`
  - Previously failed silently when routes array was empty

- fix(flame): codeblock language unsupport mdx and env
  - Added support for `mdx` and `env` language identifiers in code blocks
  - Prevents errors when using unsupported language tags

- feat(flame): npm package distribution with CLI, SSR, and DRY refactor
  - Published as npm package with `flame` CLI binary
  - Added server-side rendering support
  - Refactored shared utilities to reduce duplication

- fix(flame): replace IntersectionObserver with scroll-based TOC heading detection
  - Replaced IntersectionObserver API with scroll event-based heading detection
  - More reliable table of contents highlighting across browsers

## 1.0.0-beta.60

### Patch Changes

- fix(flame): prevent path doubling in flattenRoutes and getRouteMap
  - Fixed route generation to prevent duplicate path segments
  - Ensures routes like `/docs/getting-started` instead of `/docs/docs/getting-started`

- fix(flame): escape frontmatter title and description in build htmlShell
  - Properly escapes HTML entities in frontmatter fields
  - Prevents XSS through malformed frontmatter content

- fix(flame): only persist build cache on fully successful build
  - Build cache is now only saved when all pages build successfully
  - Prevents corrupted cache from partial build failures

- fix(flame): replace shell template with safe Bun.spawn for tailwind cli
  - Replaced shell command interpolation with `Bun.spawn` for Tailwind CSS CLI
  - Eliminates shell injection risk in build pipeline

- fix(flame): refine search indexer to preserve component text content
  - Search indexer now correctly extracts text from React components
  - Improves search accuracy for MDX content with embedded components

- fix(flame): correct fuzzy search scoring bias for long words
  - Fixed scoring algorithm that unfairly penalized longer search terms
  - More balanced search results across word lengths

- fix(flame): replace unsafe-inline CSP with nonce and hash-based approach
  - Replaced `unsafe-inline` Content Security Policy with nonce-based approach
  - Added hash-based CSP for inline scripts
  - Significant security improvement for production deployments

- fix(flame): prevent path traversal via directory name prefix confusion
  - Added validation to prevent directory names from being used to traverse paths
  - Blocks attempts like `../` in directory names

- fix(flame): eliminate duplicate routes for index.mdx in subdirectories
  - Fixed route generation to not create duplicate entries for index files
  - Each directory now has exactly one index route

- perf(flame): add optimizeImports for lucide-react barrel optimization
  - Added import optimization for lucide-react icons
  - Reduces bundle size by tree-shaking unused icon imports

- fix(flame): resolve timer leak in Toc.tsx handleLinkClick
  - Fixed memory leak from uncleared timers in table of contents
  - Timers are now properly cleaned up on component unmount

- fix(flame): resolve MDX hydration mismatch and content flicker
  - Fixed hydration mismatch between server-rendered and client-rendered MDX
  - Eliminated content flicker during page load

- refactor(flame): use hydrateRoot + MDXRemote for client hydration
  - Migrated from vanilla DOM manipulation to React `hydrateRoot`
  - MDX content now hydrates properly with React's reconciliation

## 1.0.0-beta.50

### Patch Changes

- fix(flame): improve logger data integrity and error observability
  - Enhanced logger to maintain data integrity during concurrent writes
  - Added structured error context for better debugging

- fix(flame): address PR #93 review — DRY logger guard, fix version/colors/stderr
  - DRY'd up logger guard logic
  - Fixed version display, color handling, and stderr output
  - Added test coverage for logger improvements

## 1.0.0-beta.40

### Minor Changes

- feat(flame): add optional Sentry error tracking integration
  - Added pluggable Sentry integration for error tracking
  - Configurable via `docu.json` configuration

- feat: implement structured logging and observability
  - Added structured logging with consistent format
  - Improved observability for build and runtime processes

### Patch Changes

- fix(security): add path traversal validation in preview.ts and strengthen server.ts guard
  - Added path traversal checks in preview server
  - Strengthened input validation in dev server

- fix(security): validate slug path before git operations
  - Slug paths are now validated before any git commands
  - Prevents command injection through malicious slugs

- feat(security): add HTTP security headers to all applications
  - Added security headers (CSP, X-Frame-Options, etc.) to all served pages
  - Protects against clickjacking, MIME sniffing, and other attacks

- fix(packages): path traversal guard, CI-compatible logger, and strict error handling
  - Added path traversal guards across all packages
  - Logger now works correctly in CI environments
  - Strict error handling prevents silent failures

- fix: resolve silent error swallowing in flame build pipeline
  - Build errors are now properly propagated and reported
  - Previously errors were caught and silently discarded

- fix: single MDX error kills entire flame build
  - One failing MDX file no longer crashes the entire build
  - Build continues with remaining files and reports individual errors

- fix: Replaced useSyncExternalStore with getServerSnapshot
  - Fixed server-side rendering compatibility
  - Proper snapshot handling for React 19

- perf: sequential build, hover re-renders, framer-motion bloat
  - Optimized build to process files sequentially for stability
  - Reduced unnecessary re-renders on hover interactions
  - Removed framer-motion dependency to reduce bundle size

- fix(flame): error boundary in flame dev server
  - Added error boundary to catch and display runtime errors
  - Dev server no longer crashes on component errors

- fix: issues URL injection, path traversal, innerHTML
  - Fixed URL injection vulnerabilities
  - Prevented path traversal in URL handling
  - Replaced unsafe `innerHTML` with safe alternatives

- chore: remove dead files and fix misclassified deps
  - Cleaned up unused files
  - Moved dev-only dependencies to devDependencies

- fix(flame): UI improvements and navbar active state
  - Improved navbar active state highlighting
  - General UI polish and consistency fixes

- feat(flame): add mobile bar with hydration and sticky behavior
  - Added mobile navigation bar component
  - Sticky positioning with proper hydration support

- fix(flame): fix pagination and route path generation
  - Fixed pagination component rendering
  - Corrected route path generation logic
