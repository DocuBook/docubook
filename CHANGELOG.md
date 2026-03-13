# CHANGELOG - DocuBook CLI

All notable changes to this project will be documented in this file.

## cli-v0.2.7 - 2026-03-14

### Fixed
- Semantic version comparison in `docubook update` command
  - Replaced string equality (`===`) with `semver.lt()` for proper version comparison
  - Fixes issue where second `docubook update` would re-fetch and downgrade instead of detecting current version
  - Now properly handles pre-release versions (1.0.0-beta.1 < 1.0.0) and build metadata (1.0.0+build.1)
  - Added `semver ^7.7.4` as dependency

### Improved
- Build performance by replacing pnpm global overrides with `.pnpmfile.cjs` hook
  - More efficient dependency resolution (only affects packages that depend on flatted)
  - Avoids full tree re-resolution, reducing pnpm install/build overhead
  - Maintains flatted >=3.4.0 security fix for DoS vulnerability

---

## cli-v0.2.6 - 2026-03-14

### Fixed
- Changelog section extraction regex matching subsection headings (###) instead of only version headings (##)
- Changelog not displaying after successful update due to incorrect heading level detection

### Changed
- Simplified changelog fetch to use only `cli-v{version}` tag format instead of multiple variants

---

## cli-v0.2.5 - 2026-03-14

### Added
- Update command (`docubook update`) to check for latest npm version and install automatically
- Spinner indicator while checking for updates
- Custom `--version` output formatting for CLI
- Full artistic DocuBook logo to CLI welcome screen with cyan styling

### Changed
- CLI version now dynamically loaded from package.json
- Update check displays spinner with "Checking for updates..." message
- Improved spinner management with proper scoping and cleanup

### Fixed
- Spinner not stopping correctly on error during update check
- Linter issues with global `fetch` definition
- Unused 'header' import in renderer
- Package configuration: removed `dist` from published files and adjusted `bin` path
- Removed unused `tsconfig.json` from CLI package
- Removed duplicate unused functions from packageManager.js (`getPackageManagerVersion()`, `detectDefaultPackageManager()`)

### Improved
- Error handling for update check operations
- Spinner lifecycle management to prevent memory leaks

### Removed
- Unused `tsconfig.json` from CLI package
- Two duplicate/unused functions from utilities:
  - `getPackageManagerVersion()` in packageManager.js (duplicate of packageManagerDetect.js version)
  - `detectDefaultPackageManager()` in packageManager.js (redundant with detectPackageManager())

---

## cli-v0.2.4 - 2026-03-12

### Added
- Update command (`docubook update`) to check for latest npm version and install globally
- Spinner indicator while checking for npm updates
- Custom `--version` output formatting for CLI

### Fixed
- Spinner not stopping correctly on error during update check
- Update check display showing spinner then plain "Checking for updates..." line
- Global `fetch` definition for Node.js compatibility
- Spinner scoping and cleanup to prevent dangling processes


## Tips

> [!TIP]
> **Changelog Display**
> The CLI fetches `CHANGELOG.md` from the repository tag (`raw.githubusercontent.com/{owner}/{repo}/{tag}/CHANGELOG.md`) and falls back to the `main` file when a tag-specific file isn't found. Keep headings for each released version so the CLI can extract and display the relevant section once per user.

> [!NOTE]
> **Force-show changelog**
> To force-show changelog manually, run the update command again or modify the file `$HOME/.docubook_cli_seen_changelogs.json` (advanced users only).