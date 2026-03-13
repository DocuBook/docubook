# DocuBook Guides

Complete documentation and best practices for working with the DocuBook monorepo.

## 📚 Available Guides

### 📦 Publishing & Distribution
Information about publishing packages to npm:
- **[PUBLISHING_GUIDE.md](./PUBLISHING_GUIDE.md)** - How to publish @docubook/cli packages
  - NPM OIDC setup (recommended security approach)
  - Version management
  - Release process
  - Publishing to npm registry

### 🛠️ CLI & Integration
Technical implementation and integration details:
- **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** - Integration guidelines
  - How to integrate DocuBook with your project
  - Best practices for implementation

---

## 🎯 Quick CLI Commands

### Build & Publish

```bash
# Build all packages
pnpm build

# Build only CLI
pnpm build --filter=@docubook/cli

# Lint
pnpm lint

# Lint & fix
pnpm lint:fix

# Type check
pnpm typecheck
```

### Publishing @docubook/cli

```bash
# 1. Update version in packages/cli/package.json
# "version": "0.1.1"

# 2. Build & test
pnpm build
pnpm lint
pnpm typecheck

# 3. Commit & tag
git commit -m "chore: release @docubook/cli@0.1.1"
git tag cli-v0.1.1
git push origin main --tags

# 4. GitHub Actions publishes automatically
# Monitor: https://github.com/DocuBook/docubook/actions
```

---

## 📂 Monorepo Structure

```
docubook-monorepo/
├── apps/web/                      # Main web application
├── packages/
│   ├── cli/                       # DocuBook CLI tool
│   ├── template/nextjs-vercel/   # Next.js Vercel template
│   ├── template/react-router/    # React Router template
│   ├── ui/                        # Shared UI components
│   ├── eslint-config/            # ESLint rules
│   └── typescript-config/        # TypeScript config
├── .github/
│   ├── workflows/                 # GitHub Actions
│   │   ├── build.yml             # Build & test workflow
│   │   └── publish-cli.yml       # Publish CLI to npm
│   └── guide/                     # This documentation
├── pnpm-workspace.yaml           # Workspace config
└── turbo.json                    # Turbo build config
```

---

## ✅ CLI Publishing Checklist

### One-time Setup (OIDC)
- [ ] Go to https://www.npmjs.com/settings/@docubook/access
- [ ] Click "Trusted Publishers" tab
- [ ] Add GitHub Actions as publisher:
  - Organization/user: `DocuBook`
  - Repository: `docubook`
  - Workflow filename: `publish-cli.yml`

### Before Each Release
- [ ] Update version in `packages/cli/package.json`
- [ ] Run `pnpm build --filter=@docubook/cli`
- [ ] Run `pnpm lint --filter=@docubook/cli`
- [ ] Test CLI locally: `cd packages/cli && node src/index.js --version`
- [ ] Commit changes
- [ ] Create git tag: `git tag cli-v0.X.X`
- [ ] Push to main: `git push origin main --tags`
- [ ] Monitor GitHub Actions: https://github.com/DocuBook/docubook/actions/workflows/publish-cli.yml

### Verify Publishing
```bash
# After ~2 minutes, verify on npm
npm view @docubook/cli@0.X.X

# Or install & test
npm install -g @docubook/cli@0.X.X
docubook --version
```

---

## 🚀 @docubook/cli Features

| Feature | Status | Details |
|---------|--------|---------|
| ASCII Art Logo | ✅ | Cyan-colored artistic display |
| Dynamic Version | ✅ | Auto from package.json |
| Multi-PM Support | ✅ | npm, pnpm, yarn, bun |
| Template Bundling | ✅ | nextjs-vercel, react-router |
| OIDC Publishing | ✅ | Secure GitHub Actions integration |
| Auto-detection | ✅ | Detects used package manager |

---

## 📋 Common Questions

### Q: How do I publish a new CLI version?
**A:** See [PUBLISHING_GUIDE.md](./PUBLISHING_GUIDE.md#-npm-token-setup-oidc-method---recommended)
1. Update version in `packages/cli/package.json`
2. Create and push git tag: `git tag cli-v0.X.X && git push origin main --tags`
3. GitHub Actions automatically publishes to npm

### Q: How do I set up NPM OIDC?
**A:** See [PUBLISHING_GUIDE.md](./PUBLISHING_GUIDE.md#-npm-token-setup-oidc-method---recommended)
- One-time setup at https://www.npmjs.com/settings/@docubook/access
- No secrets needed in GitHub
- Secure & recommended approach

### Q: How does the CLI detect my package manager?
**A:** Check [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
- Auto-detects from environment variables
- Supports npm, pnpm, yarn, bun
- Works with global install or npx

---

## 📌 Key Files

### CLI Package
- `packages/cli/package.json` - Version & entry point
- `packages/cli/src/index.js` - CLI entry point
- `packages/cli/src/tui/ascii.js` - ASCII art logo
- `packages/cli/src/tui/renderer.js` - UI/welcome screen
- `packages/cli/build.js` - Template bundling script

### Workflows
- `.github/workflows/build.yml` - Build & test on PR
- `.github/workflows/publish-cli.yml` - Publish on git tag

---

## ✨ Latest Updates (Session)

### CLI Improvements
- ✅ Added "files" field to package.json (include dist/ in npm)
- ✅ Implemented ASCII art logo with cyan styling
- ✅ Made version dynamic from package.json
- ✅ Updated OIDC documentation with full setup guide
- ✅ Fixed ESLint warnings
- ✅ Removed unused TypeScript config

### Documentation Updated
- ✅ Updated PUBLISHING_GUIDE.md with detailed OIDC setup
- ✅ Enhanced README.md with quick reference
- ✅ Added publishing checklist
- ✅ Simplified guide index (kept only active guides)

---

**Last Updated:** March 13, 2026
