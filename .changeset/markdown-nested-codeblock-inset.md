---
"@docubook/markdown": patch
---

Keep code blocks inside steps and accordions inset on phones. The full-bleed mobile layout now applies only outside these wrappers, so nested blocks keep their rounded border instead of overflowing the step indent or getting clipped by the accordion panel. Steps also no longer overflow their list by the item's left margin.
