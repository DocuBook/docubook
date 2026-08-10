# @docubook/core

Shared MDX compile pipeline and markdown utilities for the DocuBook ecosystem.

## Pipeline

```
raw MDX string
     │
     ▼
┌─────────────────────────────┐
│ EXTRACT  (extract.ts)       │  gray-matter → frontmatter
│                             │  regex line-scan → TOC (headings, <Release>)
└──────────┬──────────────────┘
           │ strippedContent
           ▼
┌─────────────────────────────┐
│ PARSE   (compile.ts)        │  /mdx-remote → compileMDX()
│                             │  remark:  GFM, handleCodeExpandable
│                             │  rehype:  preProcess → mermaid → codeTitles
│                             │           → expandable → prism → slug
│                             │           → autolink-headings → postProcess
└──────────┬──────────────────┘
           │ React element tree
           ▼
┌─────────────────────────────┐
│ COMPILE (content.ts)        │  readMdxFileBySlug() → fs lookup
│                             │  parseMdxFile()      → extract + validate
│                             │  compileParsedMdxFile() → compileMDX
│                             │  createMdxContentService() → cached facade
└──────────┬──────────────────┘
           ▼
   { content, frontmatter, tocs, filePath }
```

All three stages are also exposed as standalone functions for partial use.

## API

### Runtime functions

| Function | Description | Returns |
| -------- | ----------- | ------- |
| `parseMdx` | Compile raw MDX string with optional parse options | `MdxCompileResult<Frontmatter>` |
| `createMdxContentService` | Cached slug-based service: `getParsedForSlug`, `getCompiledForSlug`, `getFrontmatterForSlug`, `getTocsForSlug`. Options: `parseOptions`, `readOptions`, `tocsExtractor`, `cacheFn`, `frontmatterSchema`, `frontmatterEnricher` | service object |
| `readMdxFileBySlug` | Read `slug.mdx` or `slug/index.mdx` from docs directory | `ReadMdxFileResult` |
| `parseMdxFile` | Extract frontmatter, TOC, content, filePath from raw file result | `ParsedMdxFile<Frontmatter, TocItem>` |
| `compileParsedMdxFile` | Compile parsed MDX preserving metadata and TOCs | `CompiledMdxFile<Frontmatter, TocItem>` |
| `extractFrontmatter` | Parse frontmatter only | `Frontmatter` |
| `extractFrontmatterWithContent` | Extract frontmatter and stripped content in one pass (avoids double parsing) | `{ frontmatter, strippedContent }` |
| `extractTocsFromRawMdx` | Extract headings for TOC generation | `TocItem[]` |
| `sluggify` | Convert heading text into URL-safe slug | `string` |
| `createDefaultRehypePlugins` | Default rehype plugin stack | `Pluggable[]` |
| `createDefaultRemarkPlugins` | Default remark plugin stack | `Pluggable[]` |
| `preProcess` / `postProcess` | Code-block metadata pre/post processing | transformer |
| `handleCodeTitles` | Move code title metadata to `<pre>` attributes | transformer |
| `handleCodeExpandableRemark` / `handleCodeExpandable` | Expandable code block remark/rehype plugins | transformer |
| `rehypeMermaid` | Transform ` ```mermaid ` fenced blocks into `<Mermaid>` elements | transformer |
| `serialize` | Re-export from `@docubook/mdx-remote/serialize` for non-RSC workflows | `MDXRemoteSerializeResult` |
| `MDXRemote` | Re-export from `@docubook/mdx-remote` for client hydration | React component |
| `cn` | Merge class names (`clsx` + `tailwind-merge`) | `string` |
| `parseDate` / `stringToDate` | Parse `dd-MM-yyyy` or ISO 8601 into `Date` | `Date` |
| `formatDate` / `formatDate2` / `toIsoDateOnly` | Date formatting helpers | `string` |

### Frontmatter validation (zod)

Pass `frontmatterSchema` to `parseMdxFile` or `createMdxContentService` to validate
frontmatter after gray-matter parsing, before `frontmatterEnricher` runs.

```ts
import { z } from "zod";
import { createMdxContentService } from "@docubook/core";

const frontmatterSchema = z.object({
  title: z.coerce.string().min(1),
  description: z.coerce.string().default(""),
  image: z.coerce.string().url().optional(),
  date: z.coerce.string().optional(),
});

const docsService = createMdxContentService<z.infer<typeof frontmatterSchema>>({
  frontmatterSchema,
  readOptions: { rootDir: "/path/to/project" },
});

const doc = await docsService.getCompiledForSlug("getting-started/introduction");
```

YAML coerces unquoted values (`date: 2026-06-10` → Date, `3.5` → number), so use
`z.coerce.*` for fields that must remain strings.

### Type exports

| Type | Purpose |
| ---- | ------- |
| `MdxCompileResult` | Compiled MDX result shape |
| `TocItem` | Heading item structure |
| `ParseMdxOptions` | Options for `parseMdx` |
| `ReadMdxFileResult` | Return type of `readMdxFileBySlug` |
| `ParsedMdxFile` | Parsed file structure before compile |
| `CompiledMdxFile` | Compiled structure with metadata and TOC |
| `CreateMdxContentServiceOptions` | Service options (includes `frontmatterSchema`, `frontmatterEnricher`) |
| `ReadMdxBySlugOptions` | `rootDir` / `docsDir` configuration |

## Subpath export: `@docubook/core/utils`

Lightweight — utilities only, no MDX compile dependencies:

```ts
import { cn, parseDate, stringToDate, formatDate, formatDate2, toIsoDateOnly } from "@docubook/core/utils";
```

## Dependencies

Markdown processing dependencies are managed here and updated by the DocuBook
author — app-level users should not redeclare them.

| Category | Packages |
| -------- | -------- |
| Frontmatter | `@11ty/gray-matter` |
| MDX runtime | `@docubook/mdx-remote` (workspace) |
| Remark plugins | `remark-gfm`, `handleCodeExpandable` (internal) |
| Rehype plugins | `rehype-autolink-headings`, `rehype-code-titles`, `rehype-prism-plus`, `rehype-slug` (internal code plugins) |
| AST traversal | `unist-util-visit` |
| Utilities | `clsx`, `tailwind-merge` |
| Validation | `zod` |

## License

MIT
