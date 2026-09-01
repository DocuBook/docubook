---
"@docubook/flame": patch
"@docubook/markdown": patch
---

Refine TOC scrolling and GFM task list rendering.

### `@docubook/flame`
- Added an independent desktop TOC scroll area for long heading lists with contained overscroll behavior.
- Kept the active TOC item visible while scrolling long documents.
- Adjusted the TOC rail and `Scroll to Top` layout so the action no longer extends the TOC tree border.
- Made `Scroll to Top` resolve to `#top` instead of re-activating the first TOC heading.

### `@docubook/markdown`
- Styled GFM task lists as disabled checkboxes without redundant list bullets.
- Applied primary styling to checked task items and foreground styling to unchecked task items.
- Centralized task list styling in `packages/markdown/styles.css` as the source of truth.
