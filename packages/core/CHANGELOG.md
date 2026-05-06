# @docubook/core

## 1.6.1

### Patch Changes

- 8360248: fix: changed return types from unknown[] to Pluggable[]

## 1.6.0

### Minor Changes

- d48275d: add serialize from next-mdx-remote

## 1.5.0

### Minor Changes

- 1b937ed: core : change gray-matter to @11ty-gray-matter

## 1.4.1

### Patch Changes

- 3f601a5: feat (core) : @docubook/core@1.4.1 ;
  - Added utils.ts to export interface ElementNode extends Node
  - Removed duplicated local interface Element definitions
  - Added countCodeLines(raw: string) helper (CRLF normalization + newline edge handling).
  - Updated packages/core/src/extract.ts:90 throw explicit error with original reason
  - Added explicit returns in the plugin transformers inside packages/core/src/compile.ts

## 1.4.0

### Minor Changes

- 824acc3: feat(core): add expandable code block support ;
  - Extract handleCodeTitles plugin to separate file
  - Add handleCodeExpandableRemark to parse "Expandable" keyword from MDX code fence
  - Add handleCodeExpandable (rehype) to copy expandable attributes to pre element
  - Integrate both plugins in createDefaultRehypePlugins and createDefaultRemarkPlugins
  - Add handleCodeTitles.ts to plugins

## 1.3.2

### Patch Changes

- 2b84be1: Fix file reading logic in `readMdxFileBySlug` to try all candidate paths before failing:
  - Change catch block in the path loop from throwing error immediately to continuing to the next
    path, ensuring both `${slug}.mdx` and `slug/index.mdx` are attempted before throwing "Could not
    find mdx file".
  - This prevents premature failures when the file exists in the second path (e.g., `slug/index.mdx`
    for folder-based slugs).

## 1.3.1

### Patch Changes

- 8673171: Audit and optimize MDX compilation pipeline:
  - **extract.ts**: Improve `sluggify` function to handle Unicode accents (e.g., "café" → "cafe")
    for better SEO and consistency; add error handling in `extractFrontmatter` with fallback to
    empty object on parse failure.
  - **content.ts**: Enhance error handling in `readMdxFileBySlug` with detailed logging and clear
    error messages to prevent silent failures.
  - **Overall**: These changes improve robustness, scalability, and alignment with React/Next.js
    best practices without breaking changes.

  No changes to compile.ts, types.ts, or index.ts as they were already optimal.

## 1.3.0

### Minor Changes

- 5ea2f09: - Refactored TOC extraction to skip all headings inside triple/quad backtick code blocks,
  ensuring code examples never pollute the table of contents.

- Refactored TOC extraction to skip all headings inside triple/quad backtick code blocks, ensuring
  code examples never pollute the table of contents.
- Hardened Release version parsing: now only accepts version attribute with double quotes for
  backward compatibility and security.
- Improved regex and function naming for clarity and maintainability; removed logic ambiguity in
  fence detection.
- No breaking changes; fully backward compatible with existing MDX and Release usage.

## 1.2.0

### Minor Changes

- 385088a: core : provides enricher mechanism (generic, reusable)
