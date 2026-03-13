# DocuBook CLI - Architecture Diagram

## Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        MONOREPO STRUCTURE                         │
└─────────────────────────────────────────────────────────────────┘

packages/
├── cli/                     ← @docubook/cli (published to npm)
│   ├── src/
│   │   ├── cli/
│   │   │   ├── program.js              (CLI program + auto-detect)
│   │   │   └── promptHandler.js        (User prompts)
│   │   ├── installer/
│   │   │   └── projectInstaller.js     (Scaffolding logic)
│   │   ├── tui/
│   │   │   ├── colors.js               (Neon colors)
│   │   │   ├── renderer.js             (TUI rendering)
│   │   │   ├── spinners.js             (Animations)
│   │   │   └── state.js                (State machine)
│   │   └── utils/
│   │       ├── packageManagerDetect.js (PM auto-detection)
│   │       ├── templateDetect.js       (Template discovery)
│   │       ├── packageManager.js       (PM config)
│   │       ├── display.js              (Display utils)
│   │       └── logger.js               (Logging)
│   │
│   ├── dist/                ← BUNDLED TEMPLATES (generated on build)
│   │   ├── nextjs-vercel/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── docs/
│   │   │   ├── package.json
│   │   │   ├── docu.json
│   │   │   └── template.config.json
│   │   └── react-router/
│   │       └── (similar structure)
│   │
│   ├── build.js             ← Build script (copies template → dist)
│   └── package.json
│
├── template/                ← TEMPLATE SOURCES (version-controlled)
│   ├── nextjs-vercel/
│   │   ├── app/
│   │   ├── components/
│   │   ├── docs/
│   │   ├── package.json
│   │   ├── docu.json
│   │   └── template.config.json
│   │
│   └── react-router/
│       └── (skeleton for future)
│
├── ui/                      ← (existing shared UI components)
├── eslint-config/           ← (existing shared eslint config)
└── typescript-config/       ← (existing shared typescript config)
```

## Build Flow

```
┌──────────────────────────────────────────────────────────────┐
│  Developer: pnpm build                                        │
└──────────────────────────────────────────────────────────────┘
                             ↓
        ┌───────────────────────────────────────┐
        │  Turbo orchestrates build              │
        └───────────────────────────────────────┘
                             ↓
     ┌──────────────────────────────────────────┐
     │  packages/cli/build.js                    │
     │  - Scans packages/template/               │
     │  - Copies each → packages/cli/dist/       │
     └──────────────────────────────────────────┘
                             ↓
┌──────────────────────────────────────────────────────────────┐
│  Result:                                                      │
│  packages/cli/dist/                                           │
│    ├── nextjs-vercel/    [BUNDLED]                           │
│    └── react-router/     [BUNDLED]                           │
│                                                               │
│  Templates now READY for npm publishing                      │
└──────────────────────────────────────────────────────────────┘
```

## Publishing Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Step 1: Developer Updates & Tests                          │
├─────────────────────────────────────────────────────────────┤
│  1. Update templates in packages/template/                  │
│  2. Bump version in packages/cli/package.json               │
│  3. Run: pnpm build                                         │
│  4. Test: node src/index.js --version                       │
│  5. Commit changes                                          │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 2: Create & Push Git Tag                              │
├─────────────────────────────────────────────────────────────┤
│  git tag cli-v0.2.0                                         │
│  git push origin main --tags                                │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 3: GitHub Actions Triggered                           │
├─────────────────────────────────────────────────────────────┤
│  on: push.tags matching 'cli-v*.*.*'                        │
│  Workflow: publish-cli.yml                                  │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 4: Build & Test in CI                                 │
├─────────────────────────────────────────────────────────────┤
│  1. Checkout code                                           │
│  2. Setup Node + pnpm                                       │
│  3. Run: pnpm install                                       │
│  4. Run: pnpm build                                         │
│  5. Run: pnpm lint                                          │
│  6. (dist/ with bundled templates ready)                    │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 5: Publish to npm                                     │
├─────────────────────────────────────────────────────────────┤
│  pnpm publish packages/cli --access public                  │
│                                                              │
│  With provenance:                                           │
│    NPM_TOKEN secret                                         │
│    GitHub OIDC token                                        │
│                                                              │
│  Result: @docubook/cli@0.2.0 published                      │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 6: Create GitHub Release                              │
├─────────────────────────────────────────────────────────────┤
│  GitHub Release tag: cli-v0.2.0                             │
│  Includes: README, package.json                             │
└─────────────────────────────────────────────────────────────┘
```

## User Experience Flow

```
┌──────────────────────────────────────────────────────────────┐
│  User: npx @docubook/cli my-docs                             │
└──────────────────────────────────────────────────────────────┘
                             ↓
┌──────────────────────────────────────────────────────────────┐
│  npm downloads @docubook/cli from registry                   │
│  ✓ Includes src/                                             │
│  ✓ Includes dist/nextjs-vercel/                             │
│  ✓ Includes dist/react-router/                              │
│  ✓ No external dependencies needed                           │
└──────────────────────────────────────────────────────────────┘
                             ↓
┌──────────────────────────────────────────────────────────────┐
│  CLI Starts (src/index.js)                                   │
└──────────────────────────────────────────────────────────────┘
                             ↓
       ┌────────────────────────────────────┐
       │  Show Welcome Animation (TUI)      │
       └────────────────────────────────────┘
                             ↓
    ┌─────────────────────────────────────┐
    │  Auto-detect Package Manager        │
    │  (npm, bun, yarn, pnpm)             │
    └─────────────────────────────────────┘
                             ↓
    ┌─────────────────────────────────────┐
    │  Prompt for Project Name            │
    └─────────────────────────────────────┘
                             ↓
    ┌─────────────────────────────────────┐
    │  Prompt for Template Selection      │
    │  (scans dist/ for templates)        │
    └─────────────────────────────────────┘
                             ↓
    ┌─────────────────────────────────────┐
    │  Copy selected template             │
    │  (from dist/{template-id}/)         │
    │  to user's project directory        │
    └─────────────────────────────────────┘
                             ↓
    ┌─────────────────────────────────────┐
    │  Update package.json                │
    │  (project name, package manager)    │
    └─────────────────────────────────────┘
                             ↓
    ┌─────────────────────────────────────┐
    │  (Optional) Install dependencies    │
    │  npm/bun/yarn/pnpm install          │
    └─────────────────────────────────────┘
                             ↓
┌──────────────────────────────────────────────────────────────┐
│  Success! Display Next Steps                                 │
│  ✓ Project created: my-docs/                                │
│  ✓ cd my-docs && npm run dev                                │
└──────────────────────────────────────────────────────────────┘
```

## Template Discovery

```
At runtime, CLI discovers templates by:

1. Get templateDir():
   ├─ Check if dist/ exists (published npm)
   └─ Otherwise use development path

2. Scan templateDir/:
   ├─ Find all directories
   └─ Check for template.config.json

3. Load template metadata:
   ├─ id: "nextjs-vercel"
   ├─ name: "Next.js (Vercel)"
   ├─ description: "..."
   ├─ features: [...]
   └─ packageManagers: [...]

4. Present to user:
   ├─ Interactive prompt
   └─ User selects one

5. Copy selected template:
   ├─ Read from dist/{template-id}/
   └─ Recursively copy to user project
```

## Key Points

### ✅ Bundled Templates (Current Strategy)

```
packages/template/  ← SOURCE (git version-controlled)
        ↓ (build time)
packages/cli/dist/  ← BUNDLED (generated, .gitignore)
        ↓ (publish)
npm package         ← PUBLISHED (includes dist/)
        ↓ (user installs)
Works OFFLINE! ✓
```

### ❌ Repository-Reference (Alternative - NOT Used)

```
npm package
        ↓
CLI downloads template from GitHub at runtime
        ↓
Requires INTERNET ✗
Slower ✗
```

## File Size Impact

Current bundled approach:
- CLI code: ~100 KB
- Bundled templates: ~50 MB (with node_modules)
- Total npm package: ~150 MB (will reduce after tree-shake)

Can optimize with:
- .npmignore (exclude node_modules from dist/)
- Minification
- Compression
