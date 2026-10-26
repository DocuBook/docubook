---
"@docubook/markdown": patch
---

Treat `lucide-react` as an external peer dependency in the library build instead of inlining the entire icon set. The published bundle shrinks from ~1 MB to ~50 KB, every Lucide icon name passed as a prop keeps working through the consumer's `lucide-react`, and Flame client bundles no longer ship two copies of the icon set.
