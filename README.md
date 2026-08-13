<p align="center">
  <img alt="DocuBook" src="https://shieldcn.dev/header/dots.svg?title=DocuBook&amp;subtitle=DocuBook+is+a+modern+documentation+platform+for+building%2C+deploying%2C+and+managing+your+docs+with+ease.&amp;logo=lu%3AZap&amp;mode=dark" />
</p>

<p align="center">
  <a href="https://github.com/DocuBook/docubook/releases"><img alt="version" src="https://shieldcn.dev/npm/v/@docubook/flame.svg?split=true&amp;label=release" /></a>
  <a href="https://github.com/DocuBook/docubook/actions"><img alt="CI" src="https://shieldcn.dev/github/DocuBook/docubook/ci.svg?split=true" /></a>
  <a href="https://www.npmjs.com/package/@docubook/flame"><img alt="badge" src="https://shieldcn.dev/npm/dt/@docubook/flame.svg" /></a>
</p>

> An open-source alternative to Mintlify or GitBook. Write documentation in MDX with React.
> The toolchain runs on Bun, Node.js, or Deno — output is flat static HTML, no server required.

## Architecture

DocuBook is a **static site generator for documentation**. Flame compiles markdown into flat `.html` files — pure static output, no server required. Bun, Node.js, or Deno only powers the build toolchain and dev server.

```mermaid
sequenceDiagram
    participant Author as 📝 Author
    participant Flame as ⚙️ Flame
    participant Host as 📦 Static host
    participant Browser as 🌐 Browser

    Author->>Flame: writes markdown (.md)
    Flame->>Host: compiles to flat .html
    Browser->>Host: requests page
    Host-->>Browser: serves static HTML
```

## Prerequisites

Choose **one** runtime to get started.

### Bun (≥ 1.1.0)

```bash
# Install: https://bun.sh
curl -fsSL https://bun.sh/install | bash
# or: npm install -g bun

bun --version
```

### Node.js (≥ 20.11)

```bash
# Install: https://nodejs.org
# or: https://github.com/nvm-sh/nvm#installing-and-updating

node --version
```

### Deno (≥ 2.x)

```bash
# Install: https://deno.com
curl -fsSL https://deno.land/install.sh | sh
# or (macOS): brew install deno

deno --version
```

---

## Installation

Create the project directory once, then follow the flow for your runtime:

```bash
mkdir my-docs && cd my-docs
```

### Bun + React

```bash
bun add @docubook/flame
bunx flame init
bun run dev
```

### Node.js + React (Node >= 20.11)

```bash
npm install @docubook/flame
npx flame init
npm run dev
```

### Deno + React

```bash
deno run -A npm:@docubook/flame init
deno task dev
```

## Contributing

<!-- prettier-ignore -->
> [!NOTE]
> We are very open to all your contributions, no matter how small your contribution is, it will certainly be part of the development of this project.
> 
> Please read: [CONTRIBUTING.md](CONTRIBUTING.md)

## Workspace

<!-- prettier-ignore -->
> [!IMPORTANT]
> This repository uses a monorepo setup powered by pnpm workspaces and Turborepo to manage apps and packages in a single workspace.
>
> For development workflow:
> - Vitest provides fast unit testing with native ESM and TypeScript support
> - Changesets handles package versioning and release management
> - Husky runs automatic linting and formatting before commits
> - commitlint ensures commit messages follow the Conventional Commits format consistently
>
> This setup helps keep the codebase organized, maintainable, and contributor-friendly.
