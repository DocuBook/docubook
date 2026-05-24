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
| `extractFrontmatterWithContent` | Extract frontmatter and stripped content in one pass (avoids double parsing) | `{ frontmatter, strippedContent }` |
| `extractTocsFromRawMdx` | Extract headings for table of contents generation | `TocItem[]` |
| `sluggify` | Convert heading text into URL-safe slug | `string` |
| `createDefaultRehypePlugins` | Get default DocuBook rehype plugin stack | `unknown[]` |
| `createDefaultRemarkPlugins` | Get default DocuBook remark plugin stack | `unknown[]` |
| `preProcess` | Add pre-processing behavior for code blocks (advanced) | transformer function |
| `postProcess` | Add post-processing behavior for code blocks (advanced) | transformer function |
| `handleCodeTitles` | Move code title metadata to `<pre>` attributes (advanced) | transformer function |
| `handleCodeExpandableRemark` | Remark plugin that detects `Expandable` meta on code blocks and injects expandable data attributes | transformer function |
| `handleCodeExpandable` | Rehype plugin that propagates expandable metadata from `<code>` to `<pre>` elements | transformer function |
| `serialize` | Re-exported from `next-mdx-remote/serialize` for non-RSC MDX compilation workflows | `MDXRemoteSerializeResult` |
| `MDXRemote` | Re-exported from `next-mdx-remote` for client-side MDX hydration | React component |
| `cn` | Merge class names using `clsx` + `tailwind-merge` | `string` |
| `parseDate` | Parse `dd-MM-yyyy` or ISO 8601 date strings into a Date object | `Date` |
| `stringToDate` | Convert a string or Date value to a Date object | `Date` |
| `formatDate` | Format date to long format (e.g. "Thursday, April 5, 2026") | `string` |
| `formatDate2` | Format date to short format (e.g. "Apr 5, 2026") | `string` |
| `toIsoDateOnly` | Convert date to ISO date-only string (e.g. "2026-04-05") | `string` |

#### Type Exports

|               Type               |                                  Purpose                                  |
| -------------------------------- | ------------------------------------------------------------------------- |
| `MdxCompileResult`               | Result shape for compiled MDX content                                     |
| `TocItem`                        | Heading item structure used by TOC extraction                             |
| `ParseMdxOptions`                | Options for `parseMdx` compile behavior                                   |
| `ReadMdxFileResult`              | Return type for `readMdxFileBySlug`                                       |
| `ParsedMdxFile`                  | Parsed file structure before compile                                      |
| `CompiledMdxFile`                | Compiled file structure with metadata and TOC                             |
| `CreateMdxContentServiceOptions` | Options for creating the content service, including `frontmatterEnricher`, `tocsExtractor`, and `readOptions` |
| `ReadMdxBySlugOptions`           | Options for `readMdxFileBySlug` — configure `rootDir` and `docsDir`       |

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

#### 3. Extract frontmatter and content in one pass

```ts
import { extractFrontmatterWithContent } from "@docubook/core";

const { frontmatter, strippedContent } = extractFrontmatterWithContent<{ title: string }>(raw);
```

Use this when you need both frontmatter and the content body without the frontmatter block — avoids parsing the file twice compared to calling `extractFrontmatter` and manually stripping.

#### 4. Build TOC from raw content

```ts
import { extractTocsFromRawMdx } from "@docubook/core";
```

Use this when you need heading navigation from markdown/MDX text.

#### 5. Slug-based docs service (recommended for app integration)

```ts
import { createMdxContentService } from "@docubook/core";
```

Use this as the default app-level integration for frontmatter, TOC, and compiled docs in one service.

#### 6. Frontmatter enrichment (date fallback, computed fields)

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

#### 7. Custom TOC extraction (`tocsExtractor`)

```ts
import { createMdxContentService } from "@docubook/core";

const docsService = createMdxContentService<Frontmatter, TocItem>({
  parseOptions: { components },
  cacheFn: cache,
  tocsExtractor: (rawMdx) => {
    // Custom logic to extract headings — e.g. only h2 and h3
    return rawMdx
      .split("\n")
      .filter((line) => /^#{2,3}\s/.test(line))
      .map((line) => {
        const level = line.startsWith("###") ? 3 : 2;
        const text = line.replace(/^#{2,3}\s+/, "");
        return { level, text, href: `#${text.toLowerCase().replace(/\s+/g, "-")}` };
      });
  },
});
```

Use this when the default TOC extraction doesn't match your heading structure or you need to filter/transform headings before rendering.

#### 8. Custom docs directory (`readOptions`)

```ts
import { createMdxContentService } from "@docubook/core";

const docsService = createMdxContentService<Frontmatter, TocItem>({
  parseOptions: { components },
  cacheFn: cache,
  readOptions: {
    rootDir: "/absolute/path/to/project", // defaults to process.cwd()
    docsDir: "content", // defaults to "docs"
  },
});
```

Use this when your MDX files live in a non-standard directory (e.g. `content/` instead of `docs/`) or when the working directory differs from the project root.

#### 9. Root slug behavior

When an empty or blank slug is passed to `readMdxFileBySlug` or the content service, it resolves to `"index"` — meaning it reads `docs/index.mdx`:

```ts
// These are equivalent:
const doc = await docsService.getCompiledForSlug("");
const doc = await docsService.getCompiledForSlug("index");
// Both read from: docs/index.mdx
```

For nested slugs, the resolver tries `docs/{slug}.mdx` first, then falls back to `docs/{slug}/index.mdx`.

#### 10. Low-level file pipeline (advanced)

```ts
import {
  readMdxFileBySlug,
  parseMdxFile,
  compileParsedMdxFile,
} from "@docubook/core";
```

Use this when you need full control over each pipeline step.

#### 11. Non-RSC MDX compilation (`serialize` + `MDXRemote`)

```ts
import { serialize, MDXRemote } from "@docubook/core";

const mdxSource = await serialize(rawMdx, { parseFrontmatter: true });
// Then in your component:
<MDXRemote {...mdxSource} components={components} />;
```

Use this for Pages Router or non-RSC environments where `compileMDX` (used internally by `parseMdx`) is not available. `serialize` compiles MDX on the server and `MDXRemote` hydrates it on the client.

#### 12. Expandable code blocks (code plugins)

```ts
import {
  handleCodeExpandableRemark,
  handleCodeExpandable,
} from "@docubook/core";
```

These plugins enable collapsible/expandable code blocks in MDX. Add `Expandable` to the code block meta:

````md
```ts Expandable
// long code block that will be collapsible
```
````

`handleCodeExpandableRemark` runs during remark phase to inject `data-expandable` attributes. `handleCodeExpandable` runs during rehype phase to propagate those attributes to the rendered `<pre>` element. Both are included in `createDefaultRehypePlugins()` and `createDefaultRemarkPlugins()` by default.

#### 13. Utility functions (`cn`, date helpers)

```ts
import { cn, parseDate, formatDate, formatDate2, toIsoDateOnly } from "@docubook/core";

// Merge Tailwind classes
const className = cn("px-4 py-2", isActive && "bg-blue-500");

// Parse dates
const date = parseDate("05-04-2026"); // dd-MM-yyyy
const isoDate = parseDate("2026-04-05"); // ISO 8601

// Format dates
formatDate("2026-04-05"); // "Saturday, April 5, 2026"
formatDate2("2026-04-05"); // "Apr 5, 2026"
toIsoDateOnly("2026-04-05"); // "2026-04-05"
```

These utilities are also available via the subpath export `@docubook/core/utils`.

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

## Subpath Exports

### `@docubook/core/utils`

A lightweight subpath export containing only the utility functions — no MDX compilation dependencies. Use this when you only need class merging or date helpers without pulling in the full compile pipeline.

```ts
import { cn, parseDate, stringToDate, formatDate, formatDate2, toIsoDateOnly } from "@docubook/core/utils";
```

|    Function     |                         Description                         |
| --------------- | ----------------------------------------------------------- |
| `cn`            | Merge class names using `clsx` + `tailwind-merge`           |
| `parseDate`     | Parse `dd-MM-yyyy` or ISO 8601 date strings into a Date     |
| `stringToDate`  | Convert a string or Date value to a Date object             |
| `formatDate`    | Format date to long format (e.g. "Thursday, April 5, 2026") |
| `formatDate2`   | Format date to short format (e.g. "Apr 5, 2026")            |
| `toIsoDateOnly` | Convert date to ISO date-only string (e.g. "2026-04-05")    |

## Dependency Management Policy

Dependencies required for markdown processing are managed in this package and updated by the DocuBook author.

This means app-level users should focus on content and integration. Plugin upgrades, compatibility checks, and pipeline maintenance are handled centrally by DocuBook.

### Managed Markdown Dependencies

- @11ty/gray-matter
- rehype-autolink-headings
- rehype-code-titles
- rehype-prism-plus
- rehype-slug
- remark-gfm
- unist-util-visit

### Managed Utility Dependencies

- clsx — class name composition for the `cn()` utility
- tailwind-merge — intelligent Tailwind class merging for the `cn()` utility
- next-mdx-remote — MDX runtime/compile engine (`serialize`, `MDXRemote`)

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
