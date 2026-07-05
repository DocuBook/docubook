---
"@docubook/mdx-content": minor
"@docubook/flame": patch
---

Add GFM-style pan, zoom, and fullscreen controls to the `Mermaid` component.

- Button cluster in the bottom-right corner once a diagram renders: pan up/down/left/right, zoom in/out (clamped 0.4×–4×), reset, and a fullscreen toggle — mirroring GitHub's mermaid viewer.
- Fullscreen opens the diagram in a lightbox overlay; close it with the button or `Escape`.
- Keyboard support on the focused diagram container: arrow keys pan, `+`/`-` zoom, `0` resets.
- Interaction is button and keyboard driven only — mouse drag and scroll-wheel zoom are intentionally not intercepted, so page scrolling over diagrams keeps working.
- New `panZoom` prop (default `true`) to opt out per diagram.

**flame**: Tighter spacing in sidebar menu.
- Reduced `gap-1.5` → `gap-0.5` on menu `<ul>` containers in `Menu.tsx`.
- Reduced `py-1.5` → `py-1` on sublink items and children container in `Sublink.tsx`.
