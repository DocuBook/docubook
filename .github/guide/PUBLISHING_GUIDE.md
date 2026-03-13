# Publishing Guide - @docubook/cli

This guide explains how to publish the CLI to npm and manage template bundling.

## 📝 Latest Updates

- ✅ Templates now properly included in npm package (fixed with "files" field)
- ✅ ASCII art logo with cyan styling added to welcome screen
- ✅ Dynamic version from package.json
- ✅ CLI ready for production publishing

## Overview

The CLI uses a **bundled template** strategy (like VitePress):
- Templates are bundled in `dist/` during build
- Published to npm as a single package
- Users get offline-ready scaffolding

## Architecture

```
Development:
  packages/template/nextjs-vercel/  ← Source of truth
              ↓ (pnpm build)
  packages/cli/dist/nextjs-vercel/  ← Bundled copy

Publishing:
  packages/cli/ + dist/  → npm @docubook/cli
              ↓
  User downloads complete package (templates included)
```

## Publishing Workflow

### 1. Update Version

Update `packages/cli/package.json`:

```json
{
  "version": "0.2.0"
}
```

### 2. Build & Verify

```bash
# Install dependencies
pnpm install

# Build (bundles templates to dist/)
pnpm build

# Lint & type-check
pnpm lint
pnpm typecheck

# Test the CLI locally
cd packages/cli
node src/index.js --version  # Should show 0.2.0
node src/index.js my-test    # Test scaffolding
```

### 3. Commit & Tag

```bash
git add .
git commit -m "chore: release @docubook/cli@0.2.0"
git tag cli-v0.2.0
git push origin main --tags
```

### 4. GitHub Action Publishes

The `publish-cli.yml` workflow:
1. Triggers on tag push: `cli-v*.*.*`
2. Builds the package
3. Lints & tests
4. Publishes to npm with provenance
5. Creates GitHub release

## NPM Token Setup (OIDC Method - Recommended)

### ⚡ Quick Setup (5 minutes)

**One-time setup only (no secrets needed!):**

1. **Configure GitHub Actions OIDC in npm**:
   - Go to: https://www.npmjs.com/settings/@docubook/access
   - Click "Trusted Publishers" tab
   - Click "Add a publisher"
   - Select:
     - **Publisher type:** "GitHub Actions"
     - **Organization/user:** `DocuBook`
     - **Repository:** `docubook`
     - **Workflow filename:** `publish-cli.yml`
     - **Environment name:** (leave empty - we don't use environments)
   - Click "Set up connection"

2. **That's it!** ✅ No secrets needed. The workflow does the rest.

### How OIDC Works

```
Developer pushes tag (cli-v0.2.0)
         ↓
GitHub Actions starts workflow
         ↓
Generates JWT signed by GitHub
         ↓
Sends JWT to npm during publish
         ↓
npm verifies JWT signature
         ↓
npm checks:
  - Signature valid? ✓
  - From DocuBook org? ✓
  - From docubook repo? ✓
  - From publish-cli.yml workflow? ✓
         ↓
Publish approved! ✅ No password needed!
```

### Workflow Requirements

Our `publish-cli.yml` already has what we need:

```yaml
permissions:
  id-token: write        # Required for OIDC
  contents: read

env:
  NPM_CONFIG_PROVENANCE: true  # Enables provenance tracking
```

✅ **No changes needed** - workflow is OIDC-ready!

### Security Benefits (Why OIDC is Better)

| Feature | OIDC | Traditional Token |
|---------|------|-------------------|
| Secret stored in GitHub | ❌ No | ✅ Yes (risky) |
| Token expiration | ✅ Auto (5 min) | ❌ Manual |
| Works with 2FA | ✅ Yes | ❌ No |
| Provenance tracking | ✅ Auto | ❌ Manual |
| Can be revoked instantly | ✅ Yes | ❌ Only on GitHub |
| Risk if repo compromised | ❌ Low | ✅ High |

### Verify It's Working

After setup:

```bash
# Push a tag to trigger publish
git tag cli-v0.2.0
git push origin main --tags

# Watch GitHub Actions:
# https://github.com/DocuBook/docubook/actions/workflows/publish-cli.yml

# Then verify on npm:
npm view @docubook/cli@0.2.0
```

### Alternative: Traditional Token (Legacy)

**Only if you can't use OIDC:**

1. Create npm token: https://www.npmjs.com/settings/[username]/tokens
   - Type: Automation
   - Permissions: Read and Publish
   
2. Add to GitHub secrets:
   - Name: `NPM_TOKEN`
   - Value: Your token
   
3. Update workflow (NOT RECOMMENDED):
   ```yaml
   - name: Publish to npm
     run: pnpm publish packages/cli --access public --no-git-checks
     env:
       NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
   ```

⚠️ **This is less secure** - only use if OIDC doesn't work for you.

## Versioning Strategy

Use semantic versioning:

```
cli-v0.1.0  → Initial release
cli-v0.2.0  → New features
cli-v0.2.1  → Bug fixes
cli-v1.0.0  → Major release
```

## Template Updates

When updating templates:

1. Modify files in `packages/template/nextjs-vercel/`
2. Test locally
3. Run `pnpm build` (bundles to dist/)
4. Bump CLI version (major if breaking, minor if features, patch if fixes)
5. Commit & tag for publishing

## Template Distribution

### When User Runs: `npx @docubook/cli`

```
npm registry downloads @docubook/cli package
    ↓
Includes packages/cli/dist/nextjs-vercel/
packages/cli/dist/react-router/
    ↓
No network calls needed!
    ↓
User's project scaffolded from bundled template
```

### Key Points

- ✅ Templates are **bundled** in npm package
- ✅ **No** downloading from GitHub repo at runtime
- ✅ **Offline-ready** scaffolding
- ✅ Works just like VitePress/Create React App

## Local Development

For local testing without publishing:

```bash
# Test CLI directly
cd packages/cli
node src/index.js my-test-project

# Or use pnpm link for global testing
pnpm link --global packages/cli
docubook my-test-project
```

## Troubleshooting

### Templates not bundled
```bash
cd packages/cli
node build.js
ls dist/  # Should see nextjs-vercel, react-router
```

### CLI version not updated
```bash
cd packages/cli
node src/index.js --version
cat package.json | grep version
```

### Failed npm publish
- Check NPM_TOKEN is set correctly
- Verify package.json is valid
- Check package name is `@docubook/cli`
- Ensure you have publish permissions

## Monorepo Publishing

For publishing multiple packages:

```bash
# Version all CLI-related packages
pnpm version patch -r --filter="@docubook/cli"

# Tag and push (triggers workflow)
git tag cli-v0.2.1
git push origin main --tags
```

## Changelog Format

For consistency, use this changelog format:

```markdown
## [0.2.0] - 2026-03-15

### Added
- Multi-template support
- React Router template skeleton
- Smart package manager detection

### Changed
- Updated Next.js template to v16

### Fixed
- CLI not working with bun
```

## References

- [npm Publishing Docs](https://docs.npmjs.com/cli/v10/commands/npm-publish)
- [GitHub Actions - Publish Node.js Package](https://docs.github.com/en/actions/publishing-packages/publishing-nodejs-packages)
- [Semantic Versioning](https://semver.org/)

## Questions?

See INTEGRATION_GUIDE.md for architecture details.
