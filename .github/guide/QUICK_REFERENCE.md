# Quick Reference Card

Fast reference for most common commands and rules.

## 🚀 Essential Commands

```bash
# Setup (once)
pnpm install

# Daily Development
pnpm dev:web              # Start dev server
pnpm lint:fix             # Fix code issues
pnpm format               # Format code

# Before Commit
pnpm lint                 # Check for issues
pnpm format:check         # Check formatting
pnpm typecheck            # Type check

# Building
pnpm build                # Build everything
pnpm clean && pnpm build  # Fresh build (if issues)

# Filtering (for specific workspace)
npx turbo build --filter=docubook      # Build only web
npx turbo lint --filter=docubook       # Lint only web
```

---

## 🔴 DO NOT USE

```bash
# ❌ Wrong
pnpm turbo build
npm install
npm run build

# ✅ Correct
pnpm build
pnpm install
npx turbo build
```

---

## 📦 Dependency Rules

### Add to Root `package.json`
- Used by **multiple workspaces**
- Core tooling (ESLint, TypeScript, Prettier)
- React, Next.js, UI frameworks

### Add to Workspace `package.json`
- Used by **only one workspace**
- Workspace-specific packages
- Use `workspace:*` for internal packages

### Current Root Dependencies
```json
{
  "dependencies": {
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "next": "^16.1.6",
    "@radix-ui/*": "^1.2+",
    "tailwindcss": "^4.1.18"
  }
}
```

---

## 🔍 Finding Issues

```bash
# Check dependencies
pnpm list -r

# Check outdated
pnpm outdated -r

# Clear cache & rebuild
pnpm clean
pnpm install
pnpm build --no-cache

# List all workspaces
pnpm list -r --depth=0
```

---

## 📂 Workspace Structure

```
docubook-monorepo/
├── apps/web/                    ← Main web app
├── packages/
│   ├── ui/                      ← Shared components
│   ├── eslint-config/           ← ESLint rules
│   ├── typescript-config/       ← TypeScript config
│   └── template/nextjs-vercel/  ← Starter template
├── pnpm-workspace.yaml          ← Workspace config
└── package.json                 ← Root dependencies
```

---

## ⚡ Common Workflows

### Setting Up for First Time
```bash
git clone <repo>
cd docu/core
pnpm install
pnpm build
```

### Daily Development
```bash
pnpm dev:web                    # Terminal 1: Dev server
pnpm lint:fix && pnpm format    # Terminal 2: Auto-fix
```

### Before Push
```bash
pnpm lint
pnpm format:check
pnpm typecheck
pnpm build
```

### Debugging Build Failures
```bash
pnpm clean
pnpm install
pnpm build --no-cache
npx turbo build --verbosity=full
```

### Adding New Dependency
```bash
# Shared by multiple packages → Add to root
pnpm add some-package
pnpm install

# Only one workspace → Add to workspace
cd apps/web
pnpm add some-package
```

---

## ✅ Checklist Before Publishing CLI

### Before Creating a Release Tag
- [ ] Bumped version in `packages/cli/package.json`
- [ ] Ran `pnpm build` (bundles templates to `dist/`)
- [ ] Ran `pnpm lint` and fixed any issues
- [ ] Ran `pnpm typecheck` with no errors
- [ ] Tested CLI locally: `cd packages/cli && node src/index.js --version`
- [ ] Committed and pushed all changes

### OIDC Setup (One-time, before first publish)
- [ ] Logged into npm: https://www.npmjs.com/settings/@docubook/access
- [ ] Configured Trusted Publisher:
  - [ ] Type: GitHub Actions
  - [ ] Organization/user: `DocuBook`
  - [ ] Repository: `docubook`
  - [ ] Workflow filename: `publish-cli.yml`
  - [ ] Environment name: (left empty)

### Publishing a Release
```bash
# 1. Bump version (e.g., 0.2.0)
# 2. Commit: git commit -m "chore: release @docubook/cli@0.2.0"
# 3. Create tag
git tag cli-v0.2.0
git push origin main --tags

# 4. Monitor GitHub Actions
# https://github.com/DocuBook/docubook/actions/workflows/publish-cli.yml

# 5. Verify on npm (wait ~2 minutes)
npm view @docubook/cli
```

### Verify Publishing Succeeded
- [ ] GitHub Actions workflow completed (green checkmark)
- [ ] Release created on GitHub: https://github.com/DocuBook/docubook/releases
- [ ] Package visible on npm: https://www.npmjs.com/package/@docubook/cli
- [ ] Package version matches tag

---

## 🔗 Related Guides

Full details in:
- **[README.md](./README.md)** - Guide overview
- **[MONOREPO_COMMANDS.md](./MONOREPO_COMMANDS.md)** - All commands explained
- **[WORKSPACE_RULES.md](./WORKSPACE_RULES.md)** - Dependency management
- **[ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md)** - Project structure

---

## 💡 Tips

1. **Most builds fail because of:**
   - Missing `pnpm install` after changes
   - Dependency version mismatches
   - Stale cache → Run `pnpm clean`

2. **Always run before push:**
   - `pnpm lint:fix`
   - `pnpm format`
   - `pnpm build`

3. **Use correct command:**
   - `pnpm` for scripts ✅
   - `npx turbo` for advanced filtering ✅
   - Never `pnpm turbo` ❌

---

**Last Updated:** March 13, 2026
