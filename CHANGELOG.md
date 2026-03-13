# CHANGELOG

All notable changes to this project will be documented in this file.

Format conventions
- Use a top-level heading per version. Either `## vX.Y.Z - YYYY-MM-DD` or `## X.Y.Z - YYYY-MM-DD` is accepted.
- Include short sections (Added, Changed, Fixed, Removed) under each version.
- Keep entries brief — one line per bullet.
- The CLI will attempt to fetch the section matching the installed tag (e.g. `v0.2.5`). Keeping a heading per version ensures the CLI shows the correct section once after update.
---

## v0.2.5 - 2026-03-14

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

## v0.2.4 - 2026-03-12

### Added
- Update command (`docubook update`) to check for latest npm version and install globally
- Spinner indicator while checking for npm updates
- Custom `--version` output formatting for CLI

### Fixed
- Spinner not stopping correctly on error during update check
- Update check display showing spinner then plain "Checking for updates..." line
- Global `fetch` definition for Node.js compatibility
- Spinner scoping and cleanup to prevent dangling processes


Notes
- The CLI fetches `CHANGELOG.md` from the repository tag (raw.githubusercontent.com/{owner}/{repo}/{tag}/CHANGELOG.md) and falls back to the `main` file when a tag-specific file isn't found. Keep headings for each released version so the CLI can extract and display the relevant section once per user.
- To force-show changelog manually, run the update command again or modify the file `$HOME/.docubook_cli_seen_changelogs.json` (advanced users only).