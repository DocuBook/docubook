# Publishing Guide - @docubook/cli

This guide explains how to publish the CLI to npm and manage template distribution.

## 📋 Current Status

- **CLI Version:** v0.2.2
- **Node Requirement:** >=18.0.0
- **Publishing Method:** OIDC (No secrets required)
- **Deployment Target:** npm (public scope)
- **Template Strategy:** GitHub-sourced, on-demand download

## Key Features

- ✅ Lightweight npm package (~12 KB)
- ✅ Templates stay in repo, no bundling needed
- ✅ Template updates available immediately (no CLI republish required)
- ✅ OIDC-based publishing with provenance
- ✅ Automated GitHub Actions workflow
- ✅ Support for Node 22.x LTS

## Architecture

```
GitHub Repository Structure:
├─ packages/cli/
│  ├─ src/                    ← CLI source code
│  ├─ templates.json          ← Template metadata
│  ├─ README.md
│  └─ package.json (v0.2.2)
├─ packages/template/
│  ├─ nextjs-vercel/          ← Source of truth
│  └─ react-router/           ← Source of truth
└─ .github/workflows/
   └─ publish-cli.yml         ← Automated publishing

User Flow:
npx @docubook/cli
    ↓
CLI fetches templates.json from published npm package
    ↓
User selects template
    ↓
CLI downloads template from GitHub repository
    ↓
Extracts & initializes project
```

## Publishing Workflow

### Step 1: Update CLI Version

Update `packages/cli/package.json`:

```json
{
  "name": "@docubook/cli",
  "version": "0.2.3"  // Increment version
}
```

**Versioning Strategy:**
- `0.2.x` → Bug fixes, minor features
- `0.3.0` → New features
- `1.0.0` → Stable release, breaking changes

### Step 2: Verify Package Contents

Ensure `package.json` defines what gets published:

```json
{
  "files": [
    "src",
    "README.md",
    "templates.json"
  ]
}
```

✅ These files are automatically included in npm package.

### Step 3: Validate Before Publishing

Run the following checks:

```bash
# Type check
pnpm typecheck

# Test CLI locally
cd packages/cli
node src/index.js --version
```

### Step 4: Commit & Create Git Tag

```bash
# Stage and commit changes
git add packages/cli/package.json
git commit -m "chore(cli): release v0.2.3

- Updated CLI to v0.2.3
- [List changes here if any]"

# Create tag and push (triggers workflow)
git tag -a cli-v0.2.3 -m "Release @docubook/cli v0.2.3"
git push origin main cli-v0.2.3
```

**Tag Format:** Must match `cli-v*.*.*` to trigger publishing workflow.

### Step 5: Monitor GitHub Actions

Visit https://github.com/DocuBook/docubook/actions and verify the workflow completes successfully with these steps passing:
- ✅ Build (Node 22.x)
- ✅ Lint
- ✅ Type check
- ✅ Publish to npm
- ✅ Create GitHub Release

### Step 6: Verify npm Publication

```bash
# Check published package (wait ~30 seconds for npm index)
npm view @docubook/cli@0.2.3

# Or verify installation
npm install -g @docubook/cli@latest
docubook --version
```

## NPM OIDC Setup (One-Time Configuration)

### Prerequisites

- npm organization: `@docubook` (already created)
- GitHub repository: `DocuBook/docubook`
- Admin access to npm organization settings

### Configuration Steps

1. **Visit npm Trusted Publishers:**
   Go to https://www.npmjs.com/settings/@docubook/access and click the **Trusted Publishers** tab

2. **Add GitHub Actions as Publisher:**
   - Click **Add a publisher**
   - Select **GitHub Actions**
   - Enter:
     - **Organization/user:** `DocuBook`
     - **Repository:** `docubook`
     - **Workflow filename:** `publish-cli.yml`
   - Click **Set up connection**

3. **Verify Configuration:**
   ```bash
   git tag cli-v0.2.2-test
   git push origin cli-v0.2.2-test
   # Monitor GitHub Actions for successful publish
   ```

### How OIDC Works

```
Developer pushes tag (cli-v0.2.3)
    ↓
GitHub Actions workflow triggered
    ↓
Runner generates JWT token (signed by GitHub)
    ↓
npm verifies signature & token validity
    ↓
Package published with provenance ✅
```

**Key Security Benefits:**
- ✅ No npm tokens stored in GitHub secrets
- ✅ JWT tokens are short-lived (5 minutes)
- ✅ Each publish is auditable via GitHub Actions logs
- ✅ Provenance attestation available at npm

## Workflow Configuration Details

### publish-cli.yml Structure

The workflow runs in two jobs:

**Job 1: Build and Test** — Lints, type-checks, and builds the entire workspace

**Job 2: Publish** — Publishes `packages/cli` to npm with provenance enabled, then creates a GitHub Release

**Triggers:** Tag push matching `cli-v*.*.*` or `v*.*.*`

### Key Environment Variables

```yaml
NPM_CONFIG_PROVENANCE: true  # Enables npm provenance attestation
NODE_VERSION: 22             # Latest LTS
PNPM_VERSION: 10             # Latest pnpm
```

### Permissions Required

```yaml
permissions:
  contents: read       # Read repository contents
  id-token: write      # Required for OIDC JWT generation
```

These are automatically granted by GitHub Actions.

## Template Management

### Current Templates

```json
{
  "templates": [
    {
      "id": "nextjs-vercel",
      "name": "nextjs-vercel",
      "description": "Modern documentation with Next.js and Vercel deployment",
      "url": "https://github.com/DocuBook/docubook/tree/main/packages/template/nextjs-vercel"
    },
    {
      "id": "react-router",
      "name": "react-router",
      "description": "Client-side documentation with React Router",
      "url": "https://github.com/DocuBook/docubook/tree/main/packages/template/react-router"
    }
  ]
}
```

### Updating Templates (No CLI Republish Required)

**To modify a template:**

```bash
# Edit template files
vim packages/template/nextjs-vercel/package.json

# Commit and push to main
git add packages/template/nextjs-vercel/
git commit -m "docs: update nextjs-vercel template

- Updated Next.js version
- [List changes]"

git push origin main
```

✅ **Changes are immediately available** to all users via `npx @docubook/cli`.

**To add a new template:**

1. Create template directory:
   ```bash
   mkdir packages/template/my-template
   cp -r packages/template/nextjs-vercel/* packages/template/my-template/
   ```

2. Update `packages/cli/templates.json`:
   ```json
   {
     "id": "my-template",
     "name": "my-template",
     "description": "Description of template",
     "url": "https://github.com/DocuBook/docubook/tree/main/packages/template/my-template"
   }
   ```

3. Commit and push:
   ```bash
   git add packages/template/my-template packages/cli/templates.json
   git commit -m "feat: add my-template"
   git push origin main
   ```

✅ New template appears in `npx @docubook/cli` immediately.

### Template Features

**nextjs-vercel:**
- Next.js 16 + React 19
- TypeScript, Tailwind CSS
- MDX support
- Dark mode, Algolia search
- Ready for Vercel deployment

**react-router:**
- React 19 + React Router v6
- Client-side rendering
- TypeScript, Tailwind CSS
- Lightweight, no build step required

## Package Contents (What Gets Published)

### Files Included in npm Package

Defined in `package.json` `files` array:

```
@docubook/cli@0.2.2/
├─ src/
│  ├─ index.js              ← Executable entry point
│  ├─ tui/                  ← Terminal UI components
│  ├─ utils/                ← Helper functions
│  └─ ...
├─ README.md                ← User documentation
├─ templates.json           ← Template metadata
└─ package.json             ← Package metadata
```

**Size:** ~12 KB (minimal)

### Files That Stay in GitHub Only

These are NOT published to npm:

```
docubook/ (GitHub repo)
├─ packages/template/       ← Full template source code
├─ packages/ui/             ← UI package
├─ packages/typescript-config/
├─ apps/web/                ← Documentation website
├─ .github/                 ← Workflows & guides
└─ node_modules/            ← Dependencies
```

## Local Development & Testing

### Testing CLI Locally

```bash
cd packages/cli
node src/index.js --version        # Check version
node src/index.js my-test-project  # Test with arguments
```

### Testing Installed npm Package

```bash
npm install -g @docubook/cli@latest
docubook --version
```

### Development Workflow

```bash
# Edit and test immediately (no build step)
vim packages/cli/src/index.js
cd packages/cli && node src/index.js
```

## Versioning & Release Strategy

### Semantic Versioning

Follow [semver.org](https://semver.org/):

```
MAJOR.MINOR.PATCH
 0    2     3
```

- **MAJOR (0):** Pre-1.0 development
- **MINOR (2):** New features, backwards compatible
- **PATCH (3):** Bug fixes, patches

### When to Release

| Scenario | Version Change | Example |
|----------|---|---|
| Bug fix | Increment PATCH | 0.2.2 → 0.2.3 |
| New feature (backward compatible) | Increment MINOR | 0.2.3 → 0.3.0 |
| Breaking changes | Increment MAJOR (or 1.0.0) | 0.3.0 → 1.0.0 |
| Template-only changes | **No CLI release needed** | Update `packages/template/*` |

### Release Checklist

Before publishing:

- [ ] Version updated in `package.json`
- [ ] `pnpm typecheck` passes
- [ ] Manual testing: `node src/index.js`
- [ ] Templates still downloadable
- [ ] Git tag created: `cli-v0.2.3`
- [ ] Commit message follows convention
- [ ] Co-authored-by trailer included

## Troubleshooting & Common Issues

### Publishing Fails - "Permission Denied"

**Verify OIDC setup:** https://www.npmjs.com/settings/@docubook/access → **Trusted Publishers** tab
- Organization: `DocuBook`
- Repository: `docubook`
- Workflow: `publish-cli.yml`

### Workflow Doesn't Trigger

**Tag format must match:**
```
✅ cli-v0.2.3    (CLI-specific release)
✅ v0.2.3        (Monorepo release)
❌ 0.2.3         (Missing 'v' prefix)
```

**Delete invalid tag:**
```bash
git tag -d cli-v0.2.3            # Delete locally
git push origin :cli-v0.2.3      # Delete remotely
```

### Templates Not Loading

**Validate templates.json:**
```bash
cat packages/cli/templates.json | jq .
```

### Verify npm Package After Publishing

```bash
npm view @docubook/cli@0.2.3           # Check package info
npm view @docubook/cli versions        # View all versions
npm install -g @docubook/cli@0.2.3     # Test installation
```

**Note:** Never publish locally — always use GitHub Actions (provenance won't work, and access control depends on OIDC).

## Monitoring & Verification

### After Publishing

1. **Check GitHub Actions:**
   - https://github.com/DocuBook/docubook/actions
   - Verify "Publish @docubook/cli to npm" workflow succeeded
   - Review job logs for any warnings

2. **Verify on npm:**
   ```bash
   npm view @docubook/cli@0.2.3
   # Check: version, publish date, dist.tarball
   ```

3. **Test Installation:**
   ```bash
   npm install --save-dev @docubook/cli@0.2.3
   npx docubook --version
   ```

4. **Check GitHub Release:**
   - https://github.com/DocuBook/docubook/releases
   - Verify release contains package.json and README.md

### Monitoring Deployments

**npm Registry:**
- Visit: https://www.npmjs.com/package/@docubook/cli
- Check version history and download stats

**GitHub Releases:**
- Visit: https://github.com/DocuBook/docubook/releases
- Verify release notes and assets

**Users Adoption:**
- Monitor npm downloads
- Track GitHub issues for version-related bugs

## Best Practices

### Security

- ✅ Use OIDC (no token storage needed)
- ✅ Keep workflow file simple
- ✅ Review logs after each publish
- ✅ Use immutable git tags
- ✅ Require code review before tagging

### Quality

- ✅ Run typecheck before tagging
- ✅ Test CLI locally before publishing
- ✅ Use semantic versioning consistently
- ✅ Include changelog in commit message

### Maintenance

- ✅ Keep Node.js version in workflow updated
- ✅ Keep pnpm version current
- ✅ Monitor GitHub Actions for deprecations
- ✅ Document breaking changes in README
- ✅ Archive old major versions (0.x → 1.x)

## References & Resources

- [npm OIDC Documentation](https://docs.npmjs.com/using-npm/scope)
- [GitHub OIDC Security Hardening](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [Semantic Versioning](https://semver.org/)
- [npm Package Publishing](https://docs.npmjs.com/cli/v10/commands/npm-publish)
- [GitHub Actions - Node.js](https://github.com/actions/setup-node)
- [pnpm Documentation](https://pnpm.io/)
- [Conventional Commits](https://www.conventionalcommits.org/)
