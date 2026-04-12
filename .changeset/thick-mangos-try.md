---
"@docubook/mdx-content": patch
---

feat(mdx-content): refine expandable code blocks and theme fallbacks ;

- Improve expandable code UX: stable 20-line preview, correct expand/collapse height, and footer fixed below content.
- Fix code line counting (remove off-by-one issues from newline artifacts).
- Move horizontal scrolling to code content area so footer stays full width.
- Normalize hsl(var(--token, fallback)) usage across updated MDX components using global theme token fallbacks.
- Inline YouTube block styling in YoutubeMdx (no style override dependency).
