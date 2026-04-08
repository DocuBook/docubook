---
"@docubook/core": patch
---

Audit and optimize MDX compilation pipeline:

- **extract.ts**: Improve `sluggify` function to handle Unicode accents (e.g., "café" → "cafe") for better SEO and consistency; add error handling in `extractFrontmatter` with fallback to empty object on parse failure.
- **content.ts**: Enhance error handling in `readMdxFileBySlug` with detailed logging and clear error messages to prevent silent failures.
- **Overall**: These changes improve robustness, scalability, and alignment with React/Next.js best practices without breaking changes.

No changes to compile.ts, types.ts, or index.ts as they were already optimal.