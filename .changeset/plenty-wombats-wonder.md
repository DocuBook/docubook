---
"@docubook/mdx-content": minor
---

feat(mdx-content): add expandable code block UI with accurate line handling ;

- Add new ExpandableCode component to support collapsible code blocks with a 20-line default preview and toggle footer (See all N lines / Collapse).
- Update CodeBlock to detect expandable metadata (data-expandable, data-expandable-lines, mdx-expandable-code) and render through ExpandableCode.
- Improve language resolution in CodeBlock by checking data-language, pre class, and nested code class; keep fallback to text.
- Fix total line counting by normalizing CRLF and trimming leading/trailing newline artifacts to avoid off-by-one counts.
- Refine layout behavior: no vertical scroll when expanded, horizontal scroll constrained to code content area, footer stays full-width below content.
- Export ExpandableCode from packages/mdx-content/src/components/index.ts and packages/mdx-content/src/index.ts for package consumers.
