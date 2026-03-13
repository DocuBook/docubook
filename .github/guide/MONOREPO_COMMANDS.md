# Monorepo Commands Guide

This guide explains how to use pnpm and Turbo commands in the DocuBook monorepo.

## 📦 Workspace Structure

The repository uses **pnpm workspaces** with **Turborepo** for task orchestration:

```
.
├── apps/
│   └── web/                      # Main web app (docubook)
├── packages/
│   ├── eslint-config/           # Shared ESLint config
│   ├── typescript-config/        # Shared TypeScript config
│   ├── ui/                       # Shared UI components
│   └── template/
│       └── nextjs-vercel/        # Next.js template
└── pnpm-workspace.yaml           # Workspace configuration
```

---

## 🚀 Installation

### Install All Dependencies

```bash
pnpm install
```

This installs **ALL** dependencies for:
- Root `package.json`
- `apps/web/package.json`
- `packages/*/package.json`

All packages are hoisted to `node_modules/.pnpm/` with proper symlinks.

**When to run:**
- After cloning the repository
- After changing any `package.json`
- After updating `pnpm-lock.yaml`

---

## 🏗️ Building

### Build All Workspaces (Recommended)

```bash
pnpm build
```

**What it does:**
- Runs `"build"` script from root `package.json`
- Triggers `turbo build` under the hood
- Builds all workspaces that have a `build` script
- Respects dependency order automatically
- Caches results for fast rebuilds

**Equivalent to:**
```bash
npx turbo build
```

**What gets built:**
- ✅ `packages/ui` (if it has build script)
- ✅ `apps/web`
- ✅ `packages/template/nextjs-vercel`

### Build Specific Workspace (For Development)

```bash
# Build only the web app
npx turbo build --filter=docubook

# Build only the template
npx turbo build --filter="**/nextjs-vercel"

# Build only direct dependencies of web app
npx turbo build --filter=docubook --only
```

### Force Rebuild (Skip Cache)

```bash
# Rebuild everything, ignore cache
npx turbo build --no-cache

# Rebuild including all dependents
npx turbo build --force
```

---

## 🔍 Linting

### Lint All Workspaces (Recommended)

```bash
pnpm lint
```

**What it does:**
- Runs `eslint .` in all workspaces
- Uses shared `@docubook/eslint-config`

### Auto-Fix Lint Issues

```bash
pnpm lint:fix
```

### Lint Specific Workspace

```bash
npx turbo lint --filter=docubook
```

---

## 💅 Formatting

### Check Formatting

```bash
pnpm format:check
```

Validates formatting without making changes.

### Auto-Format Code

```bash
pnpm format
```

Formats all files using Prettier configuration.

**Formats:**
- TypeScript/JavaScript files
- CSS/SCSS files
- JSON files
- Markdown files
- MDX files

---

## 🔤 Type Checking

### Type Check All Workspaces

```bash
pnpm typecheck
```

Runs TypeScript compiler on all packages.

---

## 🚀 Development

### Run All Dev Servers

```bash
pnpm dev
```

**What it does:**
- Starts dev server for `apps/web` (next dev)
- Starts dev server for `packages/template/nextjs-vercel` (next dev)
- Builds/watches shared packages like `packages/ui`
- Runs in parallel with hot reload

### Run Only Web App Dev Server

```bash
pnpm dev:web
```

**Benefits:**
- Faster startup
- Less resource usage
- Focused development

**Equivalent to:**
```bash
npx turbo dev --filter=docubook
```

---

## 🧹 Cleanup

### Clean Build Artifacts

```bash
pnpm clean
```

Removes:
- `.next/` directories
- `.turbo/` cache
- Build outputs

**When to use:**
- After major changes
- If builds are failing unexpectedly
- To reclaim disk space

---

## 📋 All Available Commands

```bash
# Installation & Setup
pnpm install                # Install all dependencies
pnpm clean                  # Clean all build artifacts

# Development
pnpm dev                    # Start all dev servers
pnpm dev:web                # Start only web app dev server

# Building
pnpm build                  # Build all packages
npx turbo build --filter=X  # Build specific workspace

# Code Quality
pnpm lint                   # Lint all packages
pnpm lint:fix               # Fix lint issues
pnpm format                 # Format all files
pnpm format:check           # Check formatting
pnpm typecheck              # Type check all packages
```

---

## ⚡ Advanced Turbo Flags

These work with `pnpm build`, `pnpm lint`, etc:

```bash
# Filter by workspace name
npx turbo build --filter=docubook

# Filter by glob pattern
npx turbo build --filter="@docubook/*"

# Build only direct dependencies
npx turbo build --only

# Skip cache
npx turbo build --no-cache

# Force rebuild including dependents
npx turbo build --force

# Only packages changed since git branch
npx turbo build --filter='[origin/main]'

# Verbose output
npx turbo build --verbosity=full
```

---

## 🚫 Don't Use These

```bash
# ❌ Avoid - redundant and confusing
pnpm turbo build

# Use instead:
pnpm build          # ✅ Simple & recommended
npx turbo build     # ✅ Explicit alternative
```

---

## 🔄 Workflow Examples

### First Time Setup
```bash
pnpm install
pnpm build
pnpm lint
```

### Daily Development
```bash
# Start dev server
pnpm dev:web

# In another terminal
pnpm lint:fix
pnpm format
```

### Before Commit
```bash
pnpm lint
pnpm format:check
pnpm typecheck
pnpm build
```

### Pre-Push (CI Simulation)
```bash
pnpm clean
pnpm install
pnpm lint
pnpm format:check
pnpm typecheck
pnpm build
```

### Debugging Build Issues
```bash
# Clean everything
pnpm clean

# Fresh install
pnpm install

# Verbose build
npx turbo build --verbosity=full

# No cache
npx turbo build --no-cache
```

---

## 📚 Key Concepts

### Root Scripts vs Direct Turbo
- **`pnpm build`** → Calls root script → Calls turbo
- **`npx turbo build`** → Direct turbo execution
- Both have the same effect, but `pnpm build` is cleaner

### Dependency Resolution
- Turbo automatically determines build order
- If `apps/web` depends on `packages/ui`, UI builds first
- Parallel execution when possible

### Caching
- Turbo caches outputs by default
- Cache key based on input files & dependencies
- Skips rebuild if nothing changed

### Workspace Dependencies
- Defined in `pnpm-workspace.yaml`
- Matches: `apps/*` and `packages/*`
- Package discovery is automatic

---

## 🆘 Troubleshooting

### Build Fails After Dependency Change
```bash
# Reinstall and rebuild
pnpm clean
pnpm install
pnpm build --no-cache
```

### Turbo Cache Issues
```bash
# Clear Turbo cache
rm -rf .turbo

# Rebuild without cache
npx turbo build --no-cache
```

### Missing Modules
```bash
# Reinstall all dependencies
pnpm install --force

# Clean and reinstall
pnpm clean
pnpm install
```

### Workspace Not Found
```bash
# List all available workspaces
pnpm list -r

# Check workspace config
cat pnpm-workspace.yaml
```

---

## 📖 Related Guides

- [TEMPLATE_BUNDLING_FAQ.md](./TEMPLATE_BUNDLING_FAQ.md) - Template specific questions
- [PUBLISHING_GUIDE.md](./PUBLISHING_GUIDE.md) - Publishing packages to npm
- [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) - Integration guidelines

---

## ✅ Rules & Best Practices

### ✅ DO

- ✅ Use `pnpm install` for all dependency changes
- ✅ Use `pnpm build` for standard builds
- ✅ Use `pnpm dev:web` for focused development
- ✅ Use `npx turbo` for advanced filtering
- ✅ Run `pnpm format:check` before commit
- ✅ Run `pnpm lint` before push
- ✅ Use `pnpm clean` when builds fail mysteriously

### ❌ DON'T

- ❌ Don't use `npm install` - use `pnpm install`
- ❌ Don't manually edit `pnpm-lock.yaml`
- ❌ Don't use `pnpm turbo` - use `pnpm build` or `npx turbo`
- ❌ Don't run package-specific scripts from root
- ❌ Don't assume sequential execution - Turbo runs in parallel
- ❌ Don't commit without running `pnpm lint`

---

## 📞 Questions?

Check the other guides in `.github/guide/` or refer to:
- [pnpm Documentation](https://pnpm.io/)
- [Turborepo Documentation](https://turbo.build/)
