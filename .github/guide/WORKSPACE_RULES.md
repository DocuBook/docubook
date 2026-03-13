# Workspace Dependencies Rules

Guidelines for managing dependencies in the DocuBook monorepo.

---

## 📋 Workspace Overview

```
docubook-monorepo (root)
├── apps/
│   └── web (docubook)              # Main web application
├── packages/
│   ├── eslint-config               # Shared ESLint configuration
│   ├── typescript-config            # Shared TypeScript configuration
│   ├── ui                           # Shared UI components
│   └── template/nextjs-vercel       # Next.js template starter
```

---

## 🔗 Dependency Hierarchy

### Root Level Dependencies

**Root `package.json` contains:**
- Development tools: ESLint, TypeScript, Prettier, Turbo
- Shared runtime dependencies (hoisted for all workspaces)
- Type definitions used across multiple packages

**Why?**
- Turborepo and pnpm tooling needs to be in root
- Reduces duplication when packages share dependencies
- Enables global commands: `pnpm lint`, `pnpm build`, etc.

### Workspace Level Dependencies

Each workspace (`apps/web`, `packages/ui`, etc.) has its own `package.json` with:
- Direct dependencies needed by that workspace
- Workspace-specific devDependencies
- Version overrides if needed

---

## ✅ Dependency Management Rules

### Rule 1: Root Packages (Hoisted)
Dependencies in root `package.json` are available to **all workspaces**.

**Root package.json contains:**
```json
{
  "dependencies": {
    "@docsearch/css": "^4.6.0",
    "@docsearch/react": "^4.0.0",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "next": "^16.1.6"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.1.18",
    "tailwindcss": "^4.1.18",
    "eslint": "^9.39.3",
    "prettier": "^3.5.3"
  }
}
```

**Accessible in:**
- ✅ `apps/web`
- ✅ `packages/template/nextjs-vercel`
- ✅ `packages/ui`
- ✅ All other workspaces

### Rule 2: Workspace References
Use `"workspace:*"` to reference other local packages.

```json
{
  "devDependencies": {
    "@docubook/eslint-config": "workspace:*",
    "@docubook/typescript-config": "workspace:*"
  }
}
```

**Benefits:**
- Automatic version resolution
- Prevents version mismatches
- Creates proper workspace dependencies

### Rule 3: Version Consistency
Keep matching versions across all workspaces.

**Root defines the versions:**
```json
{
  "dependencies": {
    "react": "19.2.3",
    "react-dom": "19.2.3"
  }
}
```

**All workspaces use same versions:**
- ✅ `apps/web` uses React 19.2.3
- ✅ `packages/template/nextjs-vercel` uses React 19.2.3
- ✅ No version conflicts

### Rule 4: Type Definitions
TypeScript types must be available globally.

**In root devDependencies:**
```json
{
  "devDependencies": {
    "@types/react": "19.2.8",
    "@types/react-dom": "19.2.3",
    "@types/node": "^20.19.30",
    "@types/unist": "^3.0.0"
  }
}
```

**Used by:**
- ✅ TypeScript compilation in all workspaces
- ✅ IDE type checking
- ✅ Build-time type validation

### Rule 5: Overrides for Consistency
Use `overrides` field to enforce versions.

```json
{
  "overrides": {
    "@types/react": "19.2.8",
    "@types/react-dom": "19.2.3"
  }
}
```

**Ensures:**
- No transitive dependency version conflicts
- Consistent types across all packages
- Prevents accidental version mismatches

---

## 🔄 When to Add Dependencies

### Add to Root if:
- Used by **multiple workspaces**
- Core tooling needed by build system
- Type definitions needed globally
- Shared across all apps

**Examples:**
```json
{
  "dependencies": {
    "react": "^19.0.0",           // Used by web, template, ui
    "next": "^16.0.0",            // Used by web, template
    "@radix-ui/react-*": "^1.2.0" // Used by multiple packages
  },
  "devDependencies": {
    "typescript": "^5.9.0",        // Used everywhere
    "eslint": "^9.39.0",           // Used everywhere
    "@types/react": "19.2.8"       // Used everywhere
  }
}
```

### Add to Workspace if:
- Used by **only that workspace**
- Workspace-specific tooling
- Version differs from other workspaces

**Example in `apps/web/package.json`:**
```json
{
  "dependencies": {
    "algoliasearch": "^5.46.3"     // Only web uses this
  },
  "devDependencies": {
    "@docubook/eslint-config": "workspace:*"
  }
}
```

---

## 📦 Current Dependencies Status

### Core Dependencies (Root)
| Package | Version | Used By |
|---------|---------|---------|
| react | 19.2.3 | All |
| react-dom | 19.2.3 | All |
| next | ^16.1.6 | web, template |
| typescript | ^5.9.3 | All (dev) |
| eslint | ^9.39.3 | All (dev) |

### UI Framework (Root)
| Package | Version | Used By |
|---------|---------|---------|
| @radix-ui/* | ^1.x | web, template, ui |
| tailwindcss | ^4.1.18 | All |
| @tailwindcss/postcss | ^4.1.18 | All (dev) |

### MDX & Content (Root)
| Package | Version | Used By |
|---------|---------|---------|
| next-mdx-remote | ^6.0.0 | web, template |
| remark-gfm | ^4.0.1 | web, template |
| rehype-* | ^6.0.0+ | web, template |

### Type Definitions (Root devDependencies)
| Package | Version | Purpose |
|---------|---------|---------|
| @types/react | 19.2.8 | React types |
| @types/react-dom | 19.2.3 | React DOM types |
| @types/node | ^20.19.30 | Node types |
| @types/unist | ^3.0.0 | AST types |

---

## ❌ Common Mistakes

### ❌ Mistake 1: Different Versions in Different Workspaces
```json
// Root
{ "react": "19.2.3" }

// apps/web
{ "react": "18.2.0" }  // ❌ Wrong! Different version
```

**Fix:**
```json
// Remove from apps/web
// Let it use root version
```

### ❌ Mistake 2: Missing Dependencies from Root
```json
// root package.json missing
// but apps/web uses it
import React from "react"  // ❌ Won't work reliably
```

**Fix:**
```json
{
  "dependencies": {
    "react": "19.2.3"  // ✅ Add to root
  }
}
```

### ❌ Mistake 3: Hardcoded Versions Instead of workspace:*
```json
{
  "devDependencies": {
    "@docubook/eslint-config": "^1.0.0"  // ❌ Version mismatch
  }
}
```

**Fix:**
```json
{
  "devDependencies": {
    "@docubook/eslint-config": "workspace:*"  // ✅ Auto-resolves
  }
}
```

### ❌ Mistake 4: Multiple Versions of Same Package
```json
// root
{ "tailwindcss": "^4.1.18" }

// apps/web
{ "tailwindcss": "^3.3.0" }  // ❌ Different version!
```

**Fix:**
```json
// Remove from workspace
// Use root version only
```

---

## 🔍 Checking Dependencies

### List All Workspaces and Their Dependencies
```bash
pnpm list -r
```

### Check Specific Dependency Version
```bash
pnpm list tailwindcss
```

### Find Duplicate Dependencies
```bash
pnpm list --depth=0
```

### Check Root Dependencies
```bash
cd /path/to/root
pnpm list
```

---

## 🚀 Adding New Dependencies

### Adding to Root (Shared)

```bash
cd /Users/wildan/Public/github/docu/core
pnpm add package-name
# or for dev dependency
pnpm add -D package-name
```

This adds to root and all workspaces can use it.

### Adding to Specific Workspace

```bash
cd /Users/wildan/Public/github/docu/core/apps/web
pnpm add package-name
# or
pnpm -F @docubook/workspace add package-name
```

This adds only to that workspace.

### Adding Workspace Reference

```bash
pnpm -F @docubook/web add @docubook/ui --workspace
```

This creates a `workspace:*` reference.

---

## 🔄 Updating Dependencies

### Update All Packages
```bash
pnpm update -r
```

### Update Specific Package
```bash
pnpm update tailwindcss
```

### Update in Specific Workspace
```bash
pnpm -F docubook update react
```

### Check for Outdated
```bash
pnpm outdated -r
```

---

## 🔒 Dependency Lock Files

### pnpm-lock.yaml
- **Purpose:** Locks exact versions of all dependencies
- **When to commit:** Always commit
- **When to update:** After `pnpm install` changes

### Update Lock File
```bash
pnpm install
```

This updates `pnpm-lock.yaml` with exact versions.

### Force Rebuild After Lock Change
```bash
pnpm install
pnpm clean
pnpm build --no-cache
```

---

## ✅ Best Practices

### ✅ DO

- ✅ Keep root dependencies synchronized
- ✅ Use `workspace:*` for internal packages
- ✅ Update `pnpm-lock.yaml` in commits
- ✅ Run `pnpm install` after pulling changes
- ✅ Check `pnpm list` before adding duplicates
- ✅ Use same versions across all workspaces
- ✅ Test build after dependency changes

### ❌ DON'T

- ❌ Don't manually edit `pnpm-lock.yaml`
- ❌ Don't use different React versions in different apps
- ❌ Don't add conflicting dependencies
- ❌ Don't forget to commit lock file changes
- ❌ Don't skip `pnpm install` after git pull
- ❌ Don't mix version constraints (^4.1.18 vs ~4.1.0)
- ❌ Don't duplicate dependencies unnecessarily

---

## 📞 Syncing Workspace Dependencies

When updating a workspace's dependencies to match root:

1. **Identify mismatches:**
   ```bash
   pnpm list -r
   ```

2. **Update workspace package.json:**
   - Update version constraints to match root
   - Remove duplicate dependencies
   - Add `workspace:*` references

3. **Reinstall:**
   ```bash
   pnpm install
   ```

4. **Test build:**
   ```bash
   pnpm build
   ```

5. **Commit changes:**
   ```bash
   git add package.json pnpm-lock.yaml
   git commit -m "Sync workspace dependencies"
   ```

---

## 📖 Related Guides

- [MONOREPO_COMMANDS.md](./MONOREPO_COMMANDS.md) - Command reference
- [PUBLISHING_GUIDE.md](./PUBLISHING_GUIDE.md) - Publishing to npm

