# @docubook/cli

Modern CLI tool for scaffolding DocuBook documentation projects.

## Features

- ✨ **Auto-detect Package Manager** - Automatically detects npm, yarn, pnpm, or bun from invocation
- 🎨 **Modern TUI** - Beautiful terminal UI with dark theme and neon accents
- 📦 **Template Selection** - Choose from multiple documentation templates
- ⚡ **Fast Setup** - Minimal prompts, sensible defaults
- 🔧 **Fully Configurable** - Customize everything after scaffolding

## Installation

```bash
npm install -g @docubook/cli
```

Or use directly with npx:

```bash
npx @docubook/cli
```

## Usage

### Create a new project

```bash
# Using npm
npx @docubook/cli my-docs

# Using bun
bunx @docubook/cli my-docs

# Using pnpm
pnpm dlx @docubook/cli my-docs

# Using yarn
yarn dlx @docubook/cli my-docs
```

The CLI will:
1. Auto-detect your package manager
2. Prompt you to select a template
3. Create your project
4. Install dependencies

### Available Templates

- **Next.js (Vercel)** - Modern documentation with Next.js, Vercel deployment ready
- **React Router** - Client-side app with React Router (coming soon)

## Package Manager Detection

The CLI automatically detects which package manager you're using:

- `npx @docubook/cli` → npm
- `bunx @docubook/cli` → bun
- `pnpm dlx @docubook/cli` → pnpm
- `yarn dlx @docubook/cli` → yarn

## License

MIT
