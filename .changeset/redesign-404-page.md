---
"@docubook/flame": patch
---

Redesign the generated 404 page.

- The project's `navbar.logo` is the page mascot, shown as an `<img>` and animated with CSS only. The page ships no script, so the animation is light, and an SVG loaded through `<img>` cannot run scripts. Without a logo, a small inline illustration takes its place. All motion uses `motion-safe:`, so the page is still for visitors who prefer reduced motion.
- "404" is the headline and "Page not found" the subheadline, followed by a one-line explanation.
- The actions are "Go to docs" and "Back to home", each with an icon, a visible label, a 44px touch target and a focus ring. On mobile they stack at full width. At a root deployment, where both point at `/`, a single "Back to home" button is shown.
- Every URL stays root-absolute under the deployment path, so the page works at any requested path.
