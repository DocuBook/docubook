# @docubook/core

## 1.8.2

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
  - @docubook/mdx-remote@1.1.0

## 1.8.1

### Patch Changes

- [#276](https://github.com/DocuBook/docubook/pull/276) [`5289e7d`](https://github.com/DocuBook/docubook/commit/5289e7d1b41359bf5405043df9cf1129631c4e20) Thanks [@pullfrog](https://github.com/apps/pullfrog)! - Multi-runtime support: flame now runs on Node.js (>=20.11) and Deno in addition to Bun.

  - New `@docubook/runt` package: `RuntimeAdapter` interface with `bunAdapter`, `nodeAdapter` (streaming `http.createServer` bridge), and `denoAdapter`.
  - flame CLI detects the runtime (`FLAME_RUNTIME` override supported) and routes `dev`/`build`/`preview`/`deploy` to Bun-native or runtime-neutral entries; existing Bun code paths are unchanged.
  - Runtime-neutral modules: pure `escapeHtml` + shared HTML shell, `child_process`-based git helpers, esbuild client bundling, and `.docu/lib` precompiled JS generated at publish for Node/Deno execution.
  - `@docubook/core`, `@docubook/mdx-content`, `@docubook/themes-colors`: dists are now bundled with tsup, producing self-contained Node-ESM-compatible output.

## 1.8.0

### Minor Changes

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

## 1.7.2

### Patch Changes

- [#227](https://github.com/DocuBook/docubook/pull/227) [`38ccae0`](https://github.com/DocuBook/docubook/commit/38ccae04cf6fb76490ac66d1f7341615863bf82a) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - chore: bump dependencies and fix prepublishOnly

  - **@docubook/core**: Upgrade TypeScript 5.9.3 → 6.0.3, tailwind-merge 2.6.1 → 3.6.0 (Tailwind v4 compatible, twMerge API unchanged), @types/react 19.2.8 → 19.2.17
  - **@docubook/mdx-content**: Upgrade TypeScript 5.9.3 → 6.0.3, react 19.2.3 → 19.2.7, react-dom 19.2.3 → 19.2.7, @types/react 19.2.8 → 19.2.17; remove redundant `clean` step from prepublishOnly script

## 1.7.1

### Patch Changes

- [#222](https://github.com/DocuBook/docubook/pull/222) [`7e742c0`](https://github.com/DocuBook/docubook/commit/7e742c0cf845f0336170c25ca94bae815d9bf1c3) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - Add `escapeMeta()` to `handleCodeExpandable` — prevent metadata injection in MDX-compiled JS.
  - New `escapeMeta()` function escapes `</` as `\u003C/` (HTML spec script data state) and `` ` `${}` `"` `\` `` as JS backslash escapes.
  - `normalizedLanguage` and `normalizedTitle` are now wrapped in `escapeMeta()` before being appended to `node.meta` as `dbLang()`/`dbTitle()`.

## 1.7.0

### Minor Changes

- feat(core): extract duplicated utils to @docubook/core #125
  - Add `clsx` and `tailwind-merge` deps to `@docubook/core`
  - Create shared utils in `packages/core/src/utils.ts` with helper functions:
    - `cn()` - clsx + tailwind-merge utility
    - `parseDate()`, `stringToDate()`, `formatDate()`, `formatDate2()`, `toIsoDateOnly()`
  - Re-export from apps and packages using `@docubook/core/utils` subpath
  - Add `./utils` subpath export to package.json to avoid fs in client bundle

### Patch Changes

- fix(core): #154 - correct moduleResolution casing in tsconfig.json

- refactor(core): #113 - remove unused `attempted` array from `readMdxFileBySlug`

- test(core): #117 - add unit tests for custom rehype/remark plugins
  - 7 tests for `handleCodeTitles` (title transfer, removal, edge cases)
  - 19 tests for `handleCodeExpandable` (remark + rehype, line counting, resolution chains)

- refactor(core): #110 - safe two-pass tree mutation in `handleCodeTitles`
  - Replace in-place splice during visit() with a two-pass approach
  - First pass collects title divs, second pass removes them in reverse order

- docs(core): #182 - document all missing exported APIs in README
  - Add `serialize` and `MDXRemote` to Runtime APIs table
  - Add `handleCodeExpandableRemark` and `handleCodeExpandable` plugins
  - Add utility functions to Runtime APIs table
  - Add import recipes for non-RSC compilation, code plugins, and utility functions
  - Add Subpath Exports section documenting `@docubook/core/utils`

## 1.6.3

### Patch Changes

- fix(core): improve error handling and add extract tests #74 ;
  - only continue on ENOENT, re-throw other errors
  - add try/catch to extractFrontmatterWithContent
  - unit tests for sluggify, extractTocs, extractFrontmatter

## 1.6.2

### Patch Changes

- test(core): add unit tests for compile.ts and content.ts ;
  - add vitest config and test script to packages/core
  - add test task to turbo.json pipeline
  - add fixture MDX files for filesystem-based tests
  - add 11 tests for compile.ts (preProcess, postProcess, parseMdx)
  - add 14 tests for content.ts (readMdxFileBySlug, parseMdxFile, createMdxContentService)

## 1.6.1

### Patch Changes

- 8360248: fix: changed return types from unknown[] to Pluggable[]

## 1.6.0

### Minor Changes

- d48275d: add serialize from next-mdx-remote

## 1.5.0

### Minor Changes

- 1b937ed: core : change gray-matter to @11ty-gray-matter

## 1.4.1

### Patch Changes

- 3f601a5: feat (core) : @docubook/core@1.4.1 ;
  - Added utils.ts to export interface ElementNode extends Node
  - Removed duplicated local interface Element definitions
  - Added countCodeLines(raw: string) helper (CRLF normalization + newline edge handling).
  - Updated packages/core/src/extract.ts:90 throw explicit error with original reason
  - Added explicit returns in the plugin transformers inside packages/core/src/compile.ts

## 1.4.0

### Minor Changes

- 824acc3: feat(core): add expandable code block support ;
  - Extract handleCodeTitles plugin to separate file
  - Add handleCodeExpandableRemark to parse "Expandable" keyword from MDX code fence
  - Add handleCodeExpandable (rehype) to copy expandable attributes to pre element
  - Integrate both plugins in createDefaultRehypePlugins and createDefaultRemarkPlugins
  - Add handleCodeTitles.ts to plugins

## 1.3.2

### Patch Changes

- 2b84be1: Fix file reading logic in `readMdxFileBySlug` to try all candidate paths before failing:
  - Change catch block in the path loop from throwing error immediately to continuing to the next
    path, ensuring both `${slug}.mdx` and `slug/index.mdx` are attempted before throwing "Could not
    find mdx file".
  - This prevents premature failures when the file exists in the second path (e.g., `slug/index.mdx`
    for folder-based slugs).

## 1.3.1

### Patch Changes

- 8673171: Audit and optimize MDX compilation pipeline:
  - **extract.ts**: Improve `sluggify` function to handle Unicode accents (e.g., "café" → "cafe")
    for better SEO and consistency; add error handling in `extractFrontmatter` with fallback to
    empty object on parse failure.
  - **content.ts**: Enhance error handling in `readMdxFileBySlug` with detailed logging and clear
    error messages to prevent silent failures.
  - **Overall**: These changes improve robustness, scalability, and alignment with React/Next.js
    best practices without breaking changes.

  No changes to compile.ts, types.ts, or index.ts as they were already optimal.

## 1.3.0

### Minor Changes

- 5ea2f09: - Refactored TOC extraction to skip all headings inside triple/quad backtick code blocks,
  ensuring code examples never pollute the table of contents.

- Refactored TOC extraction to skip all headings inside triple/quad backtick code blocks, ensuring
  code examples never pollute the table of contents.
- Hardened Release version parsing: now only accepts version attribute with double quotes for
  backward compatibility and security.
- Improved regex and function naming for clarity and maintainability; removed logic ambiguity in
  fence detection.
- No breaking changes; fully backward compatible with existing MDX and Release usage.

## 1.2.0

### Minor Changes

- 385088a: core : provides enricher mechanism (generic, reusable)
