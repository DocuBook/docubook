---
"@docubook/flame": patch
---

Fix the mobile table of contents bar's spacing and its long list.

- **Spacing**: the table of contents button now starts where the 32px menu trigger ends. The 4px strip between them, which a tap landed on neither button, is gone, and the menu dots sit 20px from the progress ring instead of 32px. Both tap targets keep their size and do not overlap.
- **Opens at the active heading**: a long list used to open at its top, so a reader near the end of the page had to scroll it to find where they were. It now opens with the active heading in the middle, and while it stays open it keeps the active heading in view as the page moves.
- **Scrolling stays in the list**: reaching either end of the list no longer scrolls the page behind it. Before, a swipe at the top of the list pulled the page up and changed the active heading.
- The active entry carries `aria-current="location"`.
