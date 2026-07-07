<p align="center">
  <img
    src="packages/flame/docs/assets/images/docu.svg"
    alt="DocuBook Logo"
    width="100"
    height="100"
  />
</p>
<h1 align="center" style="font-size: 32px;">
  DocuBook
</h1>
<h3 align="center" style="font-size: 20px;">
  An open-source alternative to Mintlify or GitBook. Write documentation in MDX with the runtime and UI library you already use. Built on React, running on Bun, Node.js, and Deno — with Vue support on the roadmap.
</h3>

[![Flame](https://shieldcn.dev/npm/v/@docubook/flame?label=Flame&variant=secondary)](https://www.npmjs.com/package/@docubook/flame)
[![Downloads](https://shieldcn.dev/npm/dt/@docubook/flame?label=Downloads&variant=secondary)](https://www.npmjs.com/package/@docubook/flame)
[![CI](https://shieldcn.dev/github/ci/DocuBook/docubook.svg?variant=secondary)](https://github.com/DocuBook/docubook/actions/workflows/ci.yml)
[![License](https://shieldcn.dev/github/license/DocuBook/docubook.svg?variant=secondary)](https://github.com/DocuBook/docubook/blob/main/LICENSE)

## Architecture

DocuBook is a **layer between MDX content and the browser**. The core pipeline compiles MDX into renderable output, and the runtime layer determines how that output is served — Node, Bun, or Deno. You bring the content; DocuBook handles everything in between.

```mermaid
flowchart TD
    A[MDX Content]
    B["@docubook/core — compile pipeline, rehype/remark plugins"]
    C["@docubook/mdx-content — portable UI components (framework-agnostic)"]
    D["@docubook/flame"]
    D1["Bun + React - ready to use"]
    D2["Node + React - ready to use"]
    D3["Deno + React - ready to use"]
    E[Browser]

    A -->  B --> C --> D
    D --> D1 --> E
    D --> D2 --> E
    D --> D3 --> E
```

## Packages

|                                     Package                                      |                                                                    Description                                                                    |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[@docubook/core](https://www.npmjs.com/package/@docubook/core)**               | Shared MDX compile pipeline, rehype/remark plugins, and markdown utilities.                                                                       |
| **[@docubook/mdx-content](https://www.npmjs.com/package/@docubook/mdx-content)** | Portable MDX components (Mermaid, CodeBlock, Tabs, etc.) with framework-agnostic adapters.                                                        |
| **[@docubook/flame](https://www.npmjs.com/package/@docubook/flame)**             | The runtime layer — a React + MDX framework that bridges compiled content to the browser. Runs on Bun, Node.js, and Deno.                         |
| **[@docubook/runt](https://www.npmjs.com/package/@docubook/runt)**               | Runtime HTTP server adapters (Bun, Node.js, Deno) behind a single `RuntimeAdapter` interface.                                                     |
| **[@docubook/cli](https://www.npmjs.com/package/@docubook/cli)**                 | CLI tool to initialize, update, and deploy documentation from your terminal.                                                                      |

## Runtimes

DocuBook is designed to be runtime-agnostic. The same MDX content runs on any supported runtime — swap the runtime layer without touching your content.

| Runtime  | UI Library |      Status      |                    Recipe                    |
| -------- | ---------- | ---------------- | -------------------------------------------- |
| **Bun**  | React      | ✅ Available      | `bun add @docubook/flame`                    |
| **Node** | React      | ✅ Available      | `npm install @docubook/flame`                |
| **Deno** | React      | ✅ Available      | `deno run -A npm:@docubook/flame init`       |
| **Bun**  | Vue        | 🔮 Planned        | —                                            |
| **Node** | Vue        | 🔮 Planned        | —                                            |
| **Deno** | Vue        | 🔮 Planned        | —                                            |

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

### Bun + React

```bash
mkdir my-docs && cd my-docs
bun add @docubook/flame
bunx flame init
bun run dev
```

### Node.js + React (Node >= 20.11)

```bash
mkdir my-docs && cd my-docs
npm install @docubook/flame
npx flame init
npm run dev
```

### Deno + React

```bash
mkdir my-docs && cd my-docs
deno run -A npm:@docubook/flame init
deno task dev
```

> [!WARNING]
> The `nextjs-vercel`, `nextjs-docker`, and `react-router` templates are **deprecated** and will no longer be maintained. Use `@docubook/flame` as the recommended starting point going forward.

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
