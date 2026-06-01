# @docubook/flame

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
  - Use import * as LucideIcons for tree-shaking compatibility with Bun
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
