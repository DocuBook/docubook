---
'@docubook/themes-colors': patch
---

Fix saturation clamping in `generateScale` dark mode

Three template literals in dark mode (`foreground`, `card-foreground`, `popover-foreground`) used `primaryS - 10` without `Math.max`, producing negative saturation values when `primaryS < 10`. Wrapped all `primaryS - N` expressions with `Math.max` to ensure valid CSS output.
