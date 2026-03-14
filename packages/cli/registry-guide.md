# @docubook/cli Registry Publishing Guide

This guide explains how to publish @docubook/cli to npm and bun registries with proper changelog generation.

## Prerequisites

- Node.js >= 18.0.0
- Git configured with commits
- Access to npm account ([@docubook scope](https://www.npmjs.com/org/docubook))
- Bun >= 1.0.0 (for bun registry)

## Publishing Workflow

### 1. Prepare Changes

Ensure all changes are committed with **conventional commit messages**:

```bash
git log --oneline
# Output should show:
# feat(cli): add new feature
# fix(cli): bug fix
# perf(cli): performance improvement
# refactor(cli): code refactoring
# deprecate(cli): deprecation notice
# remove(cli): removed feature
```

**Conventional Commit Format:**
```
<type>[optional scope]: <description>

[optional body]
[optional footer]
```

### 2. Update Version

Update version in `packages/cli/package.json`:

```json
{
  "version": "0.2.10"
}
```

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR** (x.0.0): Breaking changes
- **MINOR** (0.x.0): New features (backward compatible)
- **PATCH** (0.0.x): Bug fixes

### 3. Create Git Tag

Create a git tag with CLI prefix:

```bash
# From repository root
git tag cli-v0.2.10
git push origin cli-v0.2.10
```

**Tag Format:** `cli-v{VERSION}`

⚠️ **Important:** Tag MUST start with `cli-v` prefix. The changelog generator searches for previous tags matching this pattern.

### 4. Publish to npm

```bash
cd packages/cli

# Login to npm (one-time)
npm login

# Publish
npm publish
```

### 5. Publish to Bun

Bun uses the npm registry, so it's automatic:

```bash
# Verify bun can install
bun add -g @docubook/cli@0.2.10

# Should install from npm registry via bun
```

## Changelog Generation

When users run `docubook update`, a changelog is automatically shown **once per version**.

### How Changelog Works

1. **Git Commits First** (primary source)
   - Fetches commits between previous tag (`cli-vX.X.X`) and current tag (`cli-v0.2.10`)
   - Only includes commits from `packages/cli/` folder
   - Parses conventional commit types

2. **GitHub Release Body** (fallback)
   - Used if no commits found or git unavailable
   - Limited to 2000 characters

### Commit Type Categories

| Type | Display | Example |
|------|---------|---------|
| `feat` | **Added** | `feat(cli): support bun package manager` |
| `fix` | **Fixed** | `fix(cli): cache clearing on update` |
| `perf`, `refactor` | **Improved** | `perf(cli): optimize file operations` |
| `deprecate` | **Deprecated** | `deprecate(cli): old command syntax` |
| `remove` | **Removed** | `remove(cli): legacy template support` |

### Example Changelog Output

When user runs `docubook update` and new version is available:

```
===========================================================

## cli-v0.2.10

### Added
- Support for bun package manager [a3ca732](https://github.com/DocuBook/docubook/commit/a3ca732)

### Fixed
- Cache clearing on update [b01bdc5](https://github.com/DocuBook/docubook/commit/b01bdc5)

### Improved
- Optimize file operations [c2d3e4f](https://github.com/DocuBook/docubook/commit/c2d3e4f)

Full changelog, visit:
  https://github.com/DocuBook/docubook/releases/tag/cli-v0.2.10

===========================================================
```

Changelog is cached in `~/.docubook_cli_seen_changelogs.json` and shown only once per version.

## Complete Publishing Checklist

### Before Publishing

- [ ] All changes committed with conventional commit messages
- [ ] Version bumped in `packages/cli/package.json`
- [ ] Tested locally: `npm run lint`, `npm run dev`
- [ ] Created git tag: `git tag cli-v{VERSION}`
- [ ] Pushed tag: `git push origin cli-v{VERSION}`

### During Publishing

- [ ] Logged in: `npm login`
- [ ] Published: `npm publish`
- [ ] Verified on npm: `npm view @docubook/cli@{VERSION}`

### After Publishing

- [ ] Tested installation: `npm install -g @docubook/cli@{VERSION}`
- [ ] Verified version: `docubook version`
- [ ] Tested update check: `docubook update`
- [ ] Tested bun installation: `bun add -g @docubook/cli@{VERSION}`
- [ ] Created GitHub Release (optional, for better visibility)

## GitHub Release (Optional but Recommended)

For better visibility, create a GitHub release:

1. Go to: https://github.com/DocuBook/docubook/releases/new
2. Tag: `cli-v{VERSION}`
3. Title: `@docubook/cli v{VERSION}`
4. Description: Copy from changelog output or write custom notes
5. Publish

## Troubleshooting

### Changelog Not Showing

**Problem:** User runs `docubook update` but no changelog appears.

**Solutions:**
1. Verify git tags exist: `git tag -l | grep cli-v`
2. Verify commits in range: `git log cli-v0.2.9..cli-v0.2.10 -- packages/cli/`
3. Verify commit messages use conventional format
4. Check cache file: `cat ~/.docubook_cli_seen_changelogs.json`

### Stale Symlink After Update

**Problem:** `docubook version` shows old version after running `docubook update`.

**Solution:** Cache clearing now automatic in v0.2.10+. For older versions:
```bash
# npm
npm cache clean --force

# yarn
yarn cache clean

# pnpm
pnpm store prune

# bun
bun pm cache rm
```

### Version Not Detected on Vercel

If deploying to Vercel and version not detected:

1. Ensure `package.json` has version field
2. Ensure git is available in build environment
3. Check Vercel logs for git errors

## Notes

- **Changelog caching:** User sees changelog only once per version (cached in home directory)
- **Path filtering:** Changelog only includes commits in `packages/cli/` folder
- **Tag format:** MUST be `cli-v{VERSION}` (e.g., `cli-v0.2.10`)
- **Registry:** Both npm and bun use npm registry (npmjs.org)
- **Bin location:**
  - npm: `~/.nvm/versions/node/vX.X.X/bin/docubook`
  - bun: `~/.bun/bin/docubook`

## References

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [npm Publishing](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Bun Documentation](https://bun.sh/)
