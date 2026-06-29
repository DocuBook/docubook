# @docubook/flame

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
