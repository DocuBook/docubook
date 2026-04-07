# @docubook/core

## 1.3.0

### Minor Changes

- 5ea2f09: - Refactored TOC extraction to skip all headings inside triple/quad backtick code blocks, ensuring code examples never pollute the table of contents.

- Refactored TOC extraction to skip all headings inside triple/quad backtick code blocks, ensuring code examples never pollute the table of contents.
- Hardened Release version parsing: now only accepts version attribute with double quotes for backward compatibility and security.
- Improved regex and function naming for clarity and maintainability; removed logic ambiguity in fence detection.
- No breaking changes; fully backward compatible with existing MDX and Release usage.

## 1.2.0

### Minor Changes

- 385088a: core : provides enricher mechanism (generic, reusable)
