# @docubook/cli

## 0.6.1

### Patch Changes

- docs(cli): update react-router template status to 'in development'
  - Replace 'coming soon' with 'in development' in CLI README
  - Replace 'comingsoon' with 'in development' in root README
  - Template directory exists with plan and config files
  - Refs: #183

- fix(cli): use startsWith() for robust user agent parsing
  - Improved package manager detection reliability
  - Fixed edge cases in user agent string parsing

## 0.6.0

### Minor Changes

- feat: Deduplicate Next.js templates with base + overlay pattern
  - Templates now support `base` and `overlay` fields in `templates.json`
  - `nextjs-vercel` and `nextjs-docker` share a single `nextjs` base template
  - Overlay files (e.g. Dockerfile) are merged on top of the base during scaffolding
  - Removes duplicated template directories, reducing maintenance burden

- feat: Replace `curl`/`tar` shell commands with native `fetch` + `tar` (npm package)
  - Template downloads no longer depend on system `curl` binary
  - Extraction uses `tar` npm package via `stream/promises.pipeline`
  - Adds 30s timeout with `AbortController` for download requests
  - Adds `tar` as a dependency

- feat: Refactor package manager detection into dedicated module
  - Moved `detectInstalledPackageManager`, `getPreferredPackageManager`, and `setPreferredPackageManager` from `updateHandler.js` to `src/utils/packageManagerDetect.js`
  - Cleaner separation of concerns between update logic and PM detection

- feat: Enhanced logger with log levels and CI support
  - Added `LOG_LEVEL` env var support (`debug`, `info`, `warn`, `error`)
  - Added CI-friendly plain text output when `CI` or `NO_COLOR` env is set
  - Added `log.debug()` method

- feat: CLI handles "coming soon" templates consistently
  - Templates with `status: "coming-soon"` are shown with `(Coming Soon)` suffix and disabled in interactive prompt
  - CLI argument validation rejects coming-soon templates with a clear error message
  - `templateDetect.js` fallback scanner now propagates `base` and `status` fields

- fix: `renderWelcome()` now accepts `version` as parameter instead of importing internally
- chore: Added `vitest` test script to package.json

## 0.5.4

### Patch Changes

- GitHub Issue #90 requests two security improvements in packages/cli:
  - Replace `execSync()` with `execFileSync()` in `updateHandler.js` (detectInstalledPackageManager and installGlobal cache clean)
  - Add templateId validation in `projectInstaller.js` to prevent path traversal

## 0.5.3

### Patch Changes

- fix: Shell injection risk in CLI installer — execSync with string interpolation ;
  - Replace execSync curl/tar dengan execFileSync with array args
  - Replace execSync(\${packageManager}--version`) with execFileSync

## 0.5.2

### Patch Changes

- Fix promptHandler.js — regex validation

## 0.5.1

### Patch Changes

- beb60a7: fix: Incomplete string escaping or encoding

## 0.5.0

### Minor Changes

- 0264cc0: feat : Changed from separate JSON files in home dir to centralized ~/.docubook/
  - Storage location : Changed from separate JSON files in home dir to centralized ~/.docubook/
    directory
  - Version tracking : Changed from single JSON array to per-version files in
    ~/.docubook/changelogs/{version}.md
  - Changelog source : Changed from GitHub API release body to fetching raw CHANGELOG.md from repo
  - Parsing : Changed to extract specific version section matching ## {version} header
  - Output format : Changed to formatted unordered list with headers (max 5 items)
  - Config file name : Changed from prefs.json to cli-config.json for better DX
  - Respect package manager : Still stores user preference to use same PM for subsequent updates

## 0.4.3

### Patch Changes

- 43813f0: Fix scaffold installer runtime errors in CLI

## 0.4.2

### Patch Changes

- a6e93c8: release @docubook/cli v0.4.2
  - fix : add version flag description to CLI version command
  - chore : Helpful messages from pnpm when an update error occurs.
  - fix : prevent temp dir leaks, use portable paths, harden install commands
  - fix : prevent duplicate commands, validate template early
  - fix : validate directoryName early, guard undefined/null, throw on cancel
  - fix : pnpm manual command and improve package manager detection

## 0.4.1

### Patch Changes

- fix : only show 5 lines of changelog from release body

## 0.4.0

### Minor Changes

- 6bd3c30: Add package-manager-aware scaffolding output and persist detected package manager in
  generated project config.
