---
name: bun
description: Use when building JavaScript/TypeScript applications, running scripts, managing dependencies, bundling code, or testing. Bun is a drop-in replacement for Node.js with integrated package manager, bundler, and test runner.
metadata:
    mintlify-proj: bun
    version: "1.0"
---

# Bun Skill

## Product Summary

Bun is an all-in-one JavaScript/TypeScript runtime and toolkit shipped as a single binary. It includes a fast runtime (4x faster startup than Node.js), package manager (25x faster installs), bundler, and test runner. Use `bun run` to execute files, `bun install` to manage dependencies, `bun build` to bundle code, and `bun test` to run tests. Configuration lives in `bunfig.toml` (optional, zero-config by default). Primary docs: https://bun.com/docs

## When to Use

- **Running scripts & files**: Execute `.ts`, `.tsx`, `.js`, `.jsx` files directly without compilation setup
- **Managing dependencies**: Replace `npm install` with `bun install` for faster package management
- **Building applications**: Bundle TypeScript, JSX, React, CSS for browsers or servers with `bun build`
- **Testing**: Write Jest-compatible tests with `bun test` for unit and integration testing
- **Building HTTP servers**: Use `Bun.serve()` for high-performance REST APIs and full-stack apps
- **Monorepos**: Manage workspaces with `bun install --filter` and run scripts across packages
- **Migrating from Node.js**: Drop-in replacement for existing Node.js projects with minimal changes

## Quick Reference

### Essential Commands

| Task | Command |
|------|---------|
| Run a file | `bun run index.ts` or `bun index.ts` |
| Run a script | `bun run dev` (from package.json) |
| Install dependencies | `bun install` |
| Add a package | `bun add react` or `bun add -d @types/node` |
| Remove a package | `bun remove react` |
| Bundle code | `bun build ./index.ts --outdir ./dist` |
| Run tests | `bun test` |
| Watch mode | `bun --watch run index.ts` |
| Execute a package | `bunx cowsay "Hello"` |

### Configuration File: bunfig.toml

Located at `./bunfig.toml` or `~/.bunfig.toml`. Optional; Bun works zero-config.

```toml
[install]
dev = true                    # Install devDependencies
optional = true               # Install optionalDependencies
peer = true                   # Install peerDependencies
linker = "hoisted"           # "hoisted" or "isolated"
frozenLockfile = false        # Fail if package.json doesn't match lockfile

[test]
root = "."                    # Test root directory
coverage = false              # Enable coverage reporting
coverageThreshold = 0.9       # Require 90% coverage

[serve]
port = 3000                   # Default port for Bun.serve

[run]
shell = "system"              # "system" or "bun"
bun = false                   # Auto-alias node to bun
```

### File Types Supported

Bun transpiles on-the-fly:
- `.ts`, `.tsx` — TypeScript with JSX
- `.js`, `.jsx` — JavaScript with JSX
- `.json`, `.jsonc`, `.toml`, `.yaml` — Data files (imported as objects)
- `.html` — HTML with asset bundling
- `.css` — CSS bundling

## Decision Guidance

| Scenario | Use | Why |
|----------|-----|-----|
| **Package manager** | `bun install` vs `npm install` | Bun is 25x faster, uses global cache, supports workspaces |
| **Installation strategy** | `--linker hoisted` vs `--linker isolated` | Hoisted = traditional npm (flat node_modules); Isolated = pnpm-like (strict deps) |
| **Bundler target** | `--target browser` vs `--target bun` vs `--target node` | Browser = ESM for web; Bun = optimized for Bun runtime; Node = CommonJS for Node.js |
| **Test runner** | `bun test` vs Jest | Bun is Jest-compatible, built-in, no setup needed |
| **HTTP server** | `Bun.serve()` vs Express | Bun.serve is 2.5x faster, native routing, no dependencies |
| **Bundling** | `bun build` vs esbuild | Bun is faster, handles full-stack (server + client), native HTML imports |

## Workflow

### 1. Start a New Project
```bash
bun init my-app
cd my-app
# Choose template: Blank, React, or Library
```

### 2. Run a File
```bash
bun run index.ts
# or omit "run"
bun index.ts
```

### 3. Install Dependencies
```bash
bun install                    # Install all from package.json
bun add react                  # Add a package
bun add -d @types/node        # Add as devDependency
bun install --production       # Production mode (no devDeps)
```

### 4. Write and Run Tests
```bash
# Create test file: math.test.ts
# Run tests
bun test
# Run specific test
bun test math
# Watch mode
bun test --watch
# Coverage
bun test --coverage
```

### 5. Build for Production
```bash
# Bundle for browser
bun build ./src/index.tsx --outdir ./dist --target browser

# Bundle for Bun runtime
bun build ./src/server.ts --outdir ./dist --target bun

# Create standalone executable
bun build ./cli.ts --outfile mycli --compile
```

### 6. Create an HTTP Server
```typescript
// server.ts
const server = Bun.serve({
  port: 3000,
  routes: {
    "/": () => new Response("Home"),
    "/api/users/:id": (req) => Response.json({ id: req.params.id }),
  },
  fetch(req) {
    return new Response("404", { status: 404 });
  }
});
console.log(`Server at ${server.url}`);
```

### 7. Write Tests
```typescript
// math.test.ts
import { expect, test, describe } from "bun:test";

describe("math", () => {
  test("2 + 2 = 4", () => {
    expect(2 + 2).toBe(4);
  });
});
```

## Common Gotchas

- **Lockfile format**: Bun uses `bun.lock` (text) by default since v1.2. Old projects may have `bun.lockb` (binary). Upgrade with `bun install --save-text-lockfile --frozen-lockfile --lockfile-only`.

- **Lifecycle scripts**: Bun does NOT run `postinstall` scripts for security. Add trusted packages to `trustedDependencies` in `package.json` to allow them.

- **Node.js compatibility**: Bun aims for Node.js compatibility but is not 100% complete. Check `/runtime/nodejs-compat` for status. Most npm packages work.

- **Flag placement**: Bun flags go AFTER `bun`, not after the command. `bun --watch run dev` ✓, `bun run dev --watch` ✗

- **Auto-install**: By default, Bun auto-installs missing packages on-the-fly. Disable with `[install] auto = "disable"` in bunfig.toml.

- **TypeScript errors on Bun global**: Install `@types/bun` and add `"lib": ["ESNext"]` to tsconfig.json.

- **Test discovery**: Tests must match `*.test.ts`, `*_test.ts`, `*.spec.ts`, or `*_spec.ts` patterns.

- **Bundler output**: Without `--outdir`, `Bun.build()` returns artifacts in memory but doesn't write to disk.

- **Environment variables**: Bun auto-loads `.env`, `.env.local`, `.env.[NODE_ENV]`. Disable with `[env] file = false` in bunfig.toml.

- **Workspaces**: Root `package.json` must have `"private": true` and no dependencies. Use `"workspace:*"` to reference workspace packages.

## Verification Checklist

Before submitting work with Bun:

- [ ] Run `bun install` to verify dependencies resolve
- [ ] Run `bun test` to verify all tests pass
- [ ] Run `bun run build` (or your build script) to verify bundling succeeds
- [ ] Check `bunfig.toml` for correct configuration (if used)
- [ ] Verify `bun.lock` is committed (for reproducible installs)
- [ ] Test with `bun run <script>` to verify scripts execute
- [ ] Check that TypeScript files compile without errors (use `bunx tsc --noEmit`)
- [ ] Verify HTTP server starts with `bun run server.ts` (if applicable)
- [ ] Confirm no `node_modules` issues with `bun install --frozen-lockfile`

## Resources

- **Comprehensive navigation**: https://bun.com/docs/llms.txt
- **Runtime API**: https://bun.com/docs/runtime
- **Package Manager**: https://bun.com/docs/pm/cli/install
- **Bundler**: https://bun.com/docs/bundler
- **Test Runner**: https://bun.com/docs/test

---

> For additional documentation and navigation, see: https://bun.com/docs/llms.txt