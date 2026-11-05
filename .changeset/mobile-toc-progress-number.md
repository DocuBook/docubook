---
"@docubook/flame": patch
---

Show the percentage inside the mobile table of contents progress ring, and tighten the space before it.

- The ring grows from 18px to 28px, which still fits the 32px bar button, and shows the percentage in its center. The number has no "%" sign, which would not fit.
- At 0 the ring shows a muted "0", so an empty ring no longer looks like a radio button. At 100 it becomes a filled disc with a check.
- The arc has a flat cap, so a partly filled ring no longer reads as a loading spinner.
- The table of contents button now starts right where the 32px menu trigger ends. The 4px dead strip between them is gone, and the menu dots sit 20px from the ring instead of 32px. Both tap targets keep their size and do not overlap.
