---
"@docubook/core": patch
---

Fix file reading logic in `readMdxFileBySlug` to try all candidate paths before failing:

- Change catch block in the path loop from throwing error immediately to continuing to the next path, ensuring both `${slug}.mdx` and `slug/index.mdx` are attempted before throwing "Could not find mdx file".
- This prevents premature failures when the file exists in the second path (e.g., `slug/index.mdx` for folder-based slugs).
