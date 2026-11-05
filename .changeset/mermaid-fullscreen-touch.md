---
"@docubook/markdown": patch
---

Adapt the Mermaid fullscreen view to touch-first devices.

On a phone, or a tablet without a mouse, fullscreen used to show the desktop controls: an <kbd>Esc</kbd> badge and help that mentioned keys and the scroll wheel. It now detects the primary input with `(hover: none) and (pointer: coarse)` and follows changes, such as a keyboard being attached.

- A **Close** button with an icon replaces the Esc badge. Its accessible name, "Close full screen", contains the visible label.
- The help panel describes touch: drag with one finger to move, the − and + buttons to zoom, tap the zoom percentage to reset, Close to exit. The diagram's accessible label follows.
- Close, help and the zoom bar buttons become 44px touch targets.
- The open help toggle keeps its "?" on touch, so the only "×" on screen belongs to Close.

On desktop, the help's "Move" line now reads "drag or arrow keys". It used to read "hold scroll wheel or tap & drag".
