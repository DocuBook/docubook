---
'@docubook/themes-colors': patch
---

fix(hex-to-hsl): prevent negative saturation in dark mode color scale

- Clamp `secondary-foreground` saturation to minimum 5% in dark mode
- Add missing `%` unit on `border-color` value in dark mode
