# @docubook/docs-tree

Prebuild navigation tree for DocuBook documentation.

## Installation

### npm
```bash
npm install --save-dev @docubook/docs-tree
```

### pnpm
```bash
pnpm add -D @docubook/docs-tree
```

### yarn
```bash
yarn add -D @docubook/docs-tree
```

### bun
```bash
bun add -d @docubook/docs-tree
```

## Usage

### npm
```bash
npx @docubook/docs-tree ./docs ./docu.json ./lib/docs-tree.json
```

### pnpm
```bash
pnpm dlx @docubook/docs-tree ./docs ./docu.json ./lib/docs-tree.json
```

### yarn
```bash
yarn dlx @docubook/docs-tree ./docs ./docu.json ./lib/docs-tree.json
```

### bun
```bash
bunx @docubook/docs-tree ./docs ./docu.json ./lib/docs-tree.json
```

Or run with default paths:
```bash
npx @docubook/docs-tree  # Uses ./docs, ./docu.json, ./docs-tree.json
```

## Implementation in DocuBook Projects

Add to your `package.json` scripts:

```json
{
  "scripts": {
    "prebuild": "pnpx @docubook/docs-tree ./docs ./docu.json ./lib/docs-tree.json",
    "build": "pnpm run prebuild && next build"
  }
}
```

Import in your routes file:

```typescript
// lib/route.ts
import docsTree from "@/lib/docs-tree.json";

export const ROUTES = docsTree;
```

The navigation tree will be prebuilt before each production build, with intelligent caching to skip regeneration when no changes are detected.