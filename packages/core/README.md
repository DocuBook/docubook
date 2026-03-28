# @docubook/core

Shared MDX compile pipeline and markdown utilities for DocuBook.

## Features

- **Centralized MDX Pipeline** - One shared compile flow for all DocuBook projects
- **Managed Remark/Rehype Plugins** - Core markdown plugins are maintained by DocuBook author
- **Content-First Workflow** - Users can focus on docs content instead of plugin maintenance
- **Utility Helpers** - Frontmatter extraction, TOC extraction, and slug helpers included
- **Consistent Behavior** - Same markdown rendering behavior across apps and templates

## Installation

Node.js ecosystem:

```bash
npm install @docubook/core
```

```bash
pnpm add @docubook/core
```

```bash
yarn add @docubook/core
```

Bun (independent runtime/package manager):

```bash
bun add @docubook/core
```

## Dependency Management Policy

Dependencies required for markdown processing are managed in this package and updated by the DocuBook author.

This means app-level users should focus on content and integration. Plugin upgrades, compatibility checks, and pipeline maintenance are handled centrally by DocuBook.

### Managed Markdown Dependencies

- gray-matter
- rehype-autolink-headings
- rehype-code-titles
- rehype-prism-plus
- rehype-slug
- remark-gfm
- unist-util-visit

The most important part is the `remark` and `rehype` plugin stack, which is intentionally owned by this package to avoid dependency drift across apps.

## Why This Matters

- Consistent behavior across all DocuBook-based projects
- Easier maintenance and safer upgrades
- Less dependency duplication in app-level package.json files
- Faster onboarding for users who only need to write docs

## Usage

```ts
import {
  parseMdx,
  extractFrontmatter,
  extractTocsFromRawMdx,
} from "@docubook/core";

const raw = `---\ntitle: Intro\n---\n\n## Hello`;

const frontmatter = extractFrontmatter<{ title: string }>(raw);
const toc = extractTocsFromRawMdx(raw);
const compiled = await parseMdx<{ title: string }>(raw);
```

### File-Based Pipeline (Recommended)

```ts
import {
  createMdxContentService,
  readMdxFileBySlug,
  parseMdxFile,
  compileParsedMdxFile,
} from "@docubook/core";

type Frontmatter = {
  title: string;
  description: string;
  image: string;
  date: string;
};

const raw = await readMdxFileBySlug("getting-started/introduction");
const parsed = parseMdxFile<Frontmatter>(raw);
const compiled = await compileParsedMdxFile(parsed, {
  components: {
    // your mdx components
  },
});

const docsService = createMdxContentService<Frontmatter>({
  parseOptions: {
    components: {
      // your mdx components
    },
  },
});

const doc = await docsService.getCompiledForSlug("getting-started/introduction");
```

## API Overview

- `parseMdx` - Compiles raw MDX with default or custom plugin options
- `createMdxContentService` - Unified high-level API for read/parse/compile/getters
- `readMdxFileBySlug` - Reads `slug.mdx` or `slug/index.mdx` from docs directory
- `parseMdxFile` - Converts raw file result into `frontmatter` + `tocs` + `content`
- `compileParsedMdxFile` - Compiles a parsed document while preserving metadata
- `extractFrontmatter` - Parses frontmatter from raw markdown/MDX
- `extractTocsFromRawMdx` - Extracts headings for TOC generation
- `sluggify` - Converts heading text into URL-friendly slugs

## Notes

If your app uses `next-mdx-remote` directly for rendering in custom components, keep that direct dependency in the app.

For compile pipeline plugins (especially `remark` and `rehype` plugins), rely on this package and avoid re-declaring them at app level unless you have a specific override requirement.

## License

MIT
