---
"@docubook/mdx-content": minor
---

Add GFM-style pan and zoom controls to the `Mermaid` component.

- Button cluster in the bottom-right corner once a diagram renders: pan up/down/left/right, zoom in/out (clamped 0.4×–4×), and reset — mirroring GitHub's mermaid viewer.
- Keyboard support on the focused diagram container: arrow keys pan, `+`/`-` zoom, `0` resets.
- Interaction is button and keyboard driven only — mouse drag and scroll-wheel zoom are intentionally not intercepted, so page scrolling over diagrams keeps working.
- New `panZoom` prop (default `true`) to opt out per diagram.
