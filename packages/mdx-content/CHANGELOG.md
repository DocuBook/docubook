# @docubook/mdx-content

## 2.2.0

### Minor Changes

- 55be6f9: - feat: improvement kbd components mapping
  - fix: icon issue background from card

## 2.1.1

### Patch Changes

- 8205896: feat(mdx-content): refine expandable code blocks and theme fallbacks ;
  - Improve expandable code UX: stable 20-line preview, correct expand/collapse height, and footer
    fixed below content.
  - Fix code line counting (remove off-by-one issues from newline artifacts).
  - Move horizontal scrolling to code content area so footer stays full width.
  - Normalize hsl(var(--token, fallback)) usage across updated MDX components using global theme
    token fallbacks.
  - Inline YouTube block styling in YoutubeMdx (no style override dependency).

## 2.1.0

### Minor Changes

- cdf5a7a: feat(mdx-content): add expandable code block UI with accurate line handling ;
  - Add new ExpandableCode component to support collapsible code blocks with a 20-line default
    preview and toggle footer (See all N lines / Collapse).
  - Update CodeBlock to detect expandable metadata (data-expandable, data-expandable-lines,
    mdx-expandable-code) and render through ExpandableCode.
  - Improve language resolution in CodeBlock by checking data-language, pre class, and nested code
    class; keep fallback to text.
  - Fix total line counting by normalizing CRLF and trimming leading/trailing newline artifacts to
    avoid off-by-one counts.
  - Refine layout behavior: no vertical scroll when expanded, horizontal scroll constrained to code
    content area, footer stays full-width below content.
  - Export ExpandableCode from packages/mdx-content/src/components/index.ts and
    packages/mdx-content/src/index.ts for package consumers.

## 2.0.0

### Major Changes

- 067fb05: refactor(mdx-content): update Tabs, Kbd, AccordionGroup, Steps, and Cards to new API
  - Refactored TabsMdx to new <Tabs>/<Tab> API, improved content scoping, and updated design.
  - Refactored KbdMdx to enforce show prop only (no children).
  - Refactored AccordionGroupMdx to use new AccordionsMdx API, with legacy alias for migration.
  - Refactored StepsMdx/StepMdx for new stepper API, with legacy alias (StepperMdx) for migration.
  - Refactored CardMdx and related card components to new API, with legacy alias for migration.
  - Updated component registry to map new and legacy components for smooth migration.
