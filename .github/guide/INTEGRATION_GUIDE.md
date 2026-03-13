# DocuBook CLI - Monorepo Integration Guide

This document describes how the DocuBook CLI has been integrated into the monorepo.

## Overview

The DocuBook CLI has been successfully integrated into the monorepo with the following structure:

```
packages/
├── cli/              # @docubook/cli - The CLI tool
├── template/
│   └── nextjs-vercel/  # Next.js + Vercel template
├── ui/               # (existing)
├── eslint-config/    # (existing)
└── typescript-config/ # (existing)
```

## Key Features

✨ **Auto-detect Package Manager** - Automatically detects npm, yarn, pnpm, or bun from invocation
🎨 **Modern TUI** - Beautiful terminal UI with dark theme and neon accents (cyan, magenta, yellow)
📦 **Multi-Template Support** - Easy template selection during scaffolding
⚡ **Fast Setup** - Minimal prompts, sensible defaults
🔧 **Future-Proof** - Easily add new templates without code changes

## Development Setup

### Install Dependencies
```bash
pnpm install
```

### Build Templates
```bash
cd packages/cli
node build.js
```

### Run CLI
```bash
cd packages/cli
node src/index.js --version
node src/index.js my-project
```

### Lint
```bash
pnpm lint
pnpm lint:fix
```

## Package Structure

### packages/cli
Contains the CLI tool and bundled templates.

**Key files:**
- `src/index.js` - Entry point
- `src/cli/program.js` - CLI program initialization with auto-detection
- `src/cli/promptHandler.js` - User prompts (project name, template selection)
- `src/installer/projectInstaller.js` - Project scaffolding logic
- `src/tui/` - Custom TUI components:
  - `colors.js` - Neon color palette
  - `renderer.js` - TUI rendering engine
  - `spinners.js` - Spinner animations
  - `state.js` - State machine
- `src/utils/` - Utilities:
  - `packageManagerDetect.js` - Auto-detect package manager
  - `templateDetect.js` - Template discovery & selection
- `build.js` - Build script to bundle templates
- `dist/` - Bundled templates (generated on build)

### packages/template/nextjs-vercel
The source Next.js + Vercel documentation template.

**Key files:**
- `template.config.json` - Template metadata
- `package.json` - Template dependencies
- `docu.json` - Site configuration template
- App, components, docs, etc.

## How It Works

### 1. Package Manager Auto-Detection

When the CLI is invoked:
```bash
npx @docubook/cli my-docs      # → npm
bunx @docubook/cli my-docs     # → bun
pnpm dlx @docubook/cli my-docs # → pnpm
yarn dlx @docubook/cli my-docs # → yarn
```

Detection happens in `src/utils/packageManagerDetect.js`:
1. Checks `process.argv[1]` for invocation method
2. Falls back to `npm_config_user_agent` environment variable
3. Defaults to `npm` if unknown

### 2. Welcome Animation

The CLI displays a beautiful welcome screen using the custom TUI:
```
╭──────────────────────────────────────╮
│                                      │
│ ✨  DocuBook CLI                      │
│                                      │
│ Modern docs scaffold tool            │
│                                      │
╰──────────────────────────────────────╯
```

### 3. Template Selection

User is prompted to select a template:
```
? Select your template:
  ▸ Next.js (Vercel) - Modern documentation with Next.js and Vercel deployment
    React Router - Client-side app with React Router (coming soon)
```

Available templates are discovered from `packages/cli/dist/` by scanning for `template.config.json`.

### 4. Project Scaffolding

The CLI:
1. Creates the project directory
2. Copies the selected template files
3. Configures package manager-specific settings (Bun, Yarn, etc.)
4. Updates `package.json` with project name
5. (Optional) Installs dependencies

### 5. Success Message

Shows next steps with relevant commands based on detected package manager.

## Adding New Templates

To add a new template:

1. Create a new directory in `packages/template/`:
   ```bash
   mkdir packages/template/my-template
   ```

2. Create `template.config.json`:
   ```json
   {
     "name": "My Template",
     "id": "my-template",
     "description": "Description of my template",
     "framework": "framework-name",
     "packageManagers": ["npm", "yarn", "pnpm", "bun"],
     "features": ["Feature 1", "Feature 2"]
   }
   ```

3. Add template files (app, components, docs, etc.)

4. Build:
   ```bash
   cd packages/cli
   node build.js
   ```

The new template will automatically appear in the template selection prompt.

## Build Process

The `build.js` script:
1. Scans `packages/template/` for directories
2. Copies each directory to `packages/cli/dist/{template-id}/`
3. Templates become available for scaffolding

This is called during:
- Manual `pnpm build`
- `pnpm dev` (via Turbo)
- Before publishing to npm

## Publishing

When publishing `@docubook/cli` to npm:
1. Templates are already bundled in `dist/`
2. The npm package includes all templates
3. Users can use the CLI offline without network calls

```bash
pnpm publish packages/cli
```

## File Tree

```
packages/cli/
├── src/
│   ├── index.js                    # Entry point
│   ├── cli/
│   │   ├── program.js             # CLI program with auto-detection
│   │   └── promptHandler.js        # User prompts
│   ├── installer/
│   │   └── projectInstaller.js    # Scaffolding logic
│   ├── tui/
│   │   ├── colors.js              # Neon colors
│   │   ├── renderer.js            # TUI rendering
│   │   ├── spinners.js            # Spinners
│   │   └── state.js               # State machine
│   └── utils/
│       ├── display.js             # Display utilities
│       ├── logger.js              # Logging
│       ├── packageManager.js       # PM configuration
│       ├── packageManagerDetect.js # PM auto-detection
│       └── templateDetect.js       # Template discovery
├── dist/                          # Bundled templates (generated)
│   └── nextjs-vercel/
├── build.js                       # Build script
├── package.json
├── tsconfig.json
├── eslint.config.mjs
└── README.md

packages/template/
└── nextjs-vercel/
    ├── app/
    ├── components/
    ├── docs/
    ├── public/
    ├── styles/
    ├── hooks/
    ├── lib/
    ├── package.json
    ├── tsconfig.json
    ├── docu.json
    ├── template.config.json
    ├── next.config.mjs
    ├── tailwind.config.ts
    ├── eslint.config.mjs
    └── README.md
```

## Troubleshooting

### Template not appearing
- Run `cd packages/cli && node build.js` to rebuild
- Check `packages/cli/dist/` for the template directory
- Verify `template.config.json` exists in the template directory

### CLI not recognizing package manager
- The detection is based on `process.argv[1]` and `npm_config_user_agent`
- Make sure you're using the correct invocation method (npx, bunx, pnpm dlx, yarn dlx)

### Dependencies not installing
- Check if the package manager is installed on your system
- Verify the template's `package.json` is valid
- Try manual installation: `cd my-project && npm install`

## Related Documentation

- [DocuBook CLI README](packages/cli/README.md)
- [Next.js Template README](packages/template/nextjs-vercel/README.md)
- [Monorepo Configuration](pnpm-workspace.yaml)
