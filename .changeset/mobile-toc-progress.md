---
"@docubook/flame": patch
---

Show reading progress in the mobile table of contents bar.

A small circular progress indicator now sits to the left of the current section's title, inline in the bar's table of contents button. It fills with the share of sections reached: the active heading's position among the page's headings. It completes at the end of the page, since a short last section never scrolls up far enough to become active. The fill animates and stays still for visitors who prefer reduced motion. The button's accessible name includes the percentage, for example "Expand table of contents, 56% of sections read".

Above the first heading, the bar now shows the page title, as the desktop table of contents does. It used to keep the last active section after scrolling back to the top.
