---
'@docubook/mdx-content': patch
'@docubook/flame': patch
---

feat(mdx-content): improve mermaid viewing UX with contextual fullscreen controls

- Remove `panZoom` prop — fullscreen button always shown when diagram renders
- Show only fullscreen button in normal view (cleaner UI, no clutter)
- Full pan/zoom controls (pan arrows, zoom +/- , reset) appear only in fullscreen
- Add scroll-wheel zoom in fullscreen mode
- Add click-and-drag to pan in fullscreen mode
- Disable transform transition during drag for responsive feel
- Enter key toggles fullscreen when diagram is focused
