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

## Usage

### Quick Start (Recommended)

```ts
import { cache } from "react";
import { createMdxContentService } from "@docubook/core";

type Frontmatter = {
  title: string;
  description: string;
  image: string;
  date: string;
};

type TocItem = {
  level: number;
  text: string;
  href: string;
};

const components = {
  // your MDX components
};

const docsService = createMdxContentService<Frontmatter, TocItem>({
  parseOptions: { components },
  cacheFn: cache,
});

const doc = await docsService.getCompiledForSlug("getting-started/introduction");
const frontmatter = await docsService.getFrontmatterForSlug("getting-started/introduction");
const tocs = await docsService.getTocsForSlug("getting-started/introduction");
```

### Importable APIs and What They Do

#### Runtime APIs

| Function | Description | Returns |
| -------- | ----------- | ------- |
| `parseMdx` | Compile raw MDX string with optional custom parse options | `MdxCompileResult<Frontmatter>` |
| `createMdxContentService` | Create slug-based docs service (`getParsedForSlug`, `getCompiledForSlug`, `getFrontmatterForSlug`, `getTocsForSlug`). Accepts optional `frontmatterEnricher` to inject computed or fallback values after parsing | service object |
| `readMdxFileBySlug` | Read `slug.mdx` or `slug/index.mdx` from docs directory | `ReadMdxFileResult` |
| `parseMdxFile` | Convert raw file result into `frontmatter`, `tocs`, `content`, `filePath` | `ParsedMdxFile<Frontmatter, TocItem>` |
| `compileParsedMdxFile` | Compile parsed MDX while preserving metadata and TOCs | `CompiledMdxFile<Frontmatter, TocItem>` |
| `extractFrontmatter` | Parse frontmatter only from raw markdown/MDX | `Frontmatter` |
| `extractTocsFromRawMdx` | Extract headings for table of contents generation | `TocItem[]` |
| `sluggify` | Convert heading text into URL-safe slug | `string` |
| `createDefaultRehypePlugins` | Get default DocuBook rehype plugin stack | `unknown[]` |
| `createDefaultRemarkPlugins` | Get default DocuBook remark plugin stack | `unknown[]` |
| `preProcess` | Add pre-processing behavior for code blocks (advanced) | transformer function |
| `postProcess` | Add post-processing behavior for code blocks (advanced) | transformer function |
| `handleCodeTitles` | Move code title metadata to `<pre>` attributes (advanced) | transformer function |

#### Type Exports

|               Type               |                                  Purpose                                  |
| -------------------------------- | ------------------------------------------------------------------------- |
| `MdxCompileResult`               | Result shape for compiled MDX content                                     |
| `TocItem`                        | Heading item structure used by TOC extraction                             |
| `ParseMdxOptions`                | Options for `parseMdx` compile behavior                                   |
| `ReadMdxFileResult`              | Return type for `readMdxFileBySlug`                                       |
| `ParsedMdxFile`                  | Parsed file structure before compile                                      |
| `CompiledMdxFile`                | Compiled file structure with metadata and TOC                             |
| `CreateMdxContentServiceOptions` | Options for creating the content service, including `frontmatterEnricher` |

### Quick Import Recipes

#### 1. Compile raw MDX only

```ts
import { parseMdx } from "@docubook/core";
```

Use this when your source is already in memory and you only need compiled content.

#### 2. Read frontmatter only

```ts
import { extractFrontmatter } from "@docubook/core";
```

Use this for metadata pages where full MDX compilation is unnecessary.

#### 3. Build TOC from raw content

```ts
import { extractTocsFromRawMdx } from "@docubook/core";
```

Use this when you need heading navigation from markdown/MDX text.

#### 4. Slug-based docs service (recommended for app integration)

```ts
import { createMdxContentService } from "@docubook/core";
```

Use this as the default app-level integration for frontmatter, TOC, and compiled docs in one service.

#### 5. Frontmatter enrichment (date fallback, computed fields)

```ts
import { createMdxContentService } from "@docubook/core";

const docsService = createMdxContentService<Frontmatter, TocItem>({
  parseOptions: { components },
  cacheFn: cache,
  frontmatterEnricher: async (frontmatter, absoluteFilePath) => {
    if (!frontmatter.date) {
      const { promises: fs } = await import("fs");
      const stat = await fs.stat(absoluteFilePath);
      return { ...frontmatter, date: stat.mtime };
    }
    return frontmatter;
  },
});
```

Use this to inject computed or fallback values into frontmatter after parsing — such as a last-modified date from the filesystem or a git commit timestamp. The enricher receives the already-parsed frontmatter and the absolute path of the MDX file on disk, and runs once per slug before caching.

#### 6. Low-level file pipeline (advanced)

```ts
import {
  readMdxFileBySlug,
  parseMdxFile,
  compileParsedMdxFile,
} from "@docubook/core";
```

Use this when you need full control over each pipeline step.

### Basic Compile Helpers

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

The `remark` and `rehype` plugin stack is intentionally owned by this package to avoid dependency drift across apps.

## Why This Matters

- Consistent behavior across all DocuBook-based projects
- Easier maintenance and safer upgrades
- Less dependency duplication in app-level package.json files
- Faster onboarding for users who only need to write docs

## Notes

`@docubook/core` already includes and manages the MDX runtime/compile dependencies (including `next-mdx-remote`) as part of the package contract.

In most integrations, users only need to install `@docubook/core` and use the core APIs.

Only add `next-mdx-remote` directly in your app if your app explicitly imports it in app-level code.

For compile pipeline plugins (especially `remark` and `rehype` plugins), rely on this package and avoid re-declaring them at app level unless you have a specific override requirement.

## License

MIT
