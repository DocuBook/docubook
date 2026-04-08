# @docubook/core

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
