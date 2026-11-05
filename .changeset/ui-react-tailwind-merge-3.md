---
"@docubook/ui-react": patch
---

`cn()` now merges classes with `tailwind-merge` v3, which follows Tailwind CSS v4 syntax. Overrides written in v4 form, such as the trailing important modifier (`p-4!`) or the CSS-variable shorthand (`p-(--gap)`), now replace the conflicting class instead of being kept next to it. ui-react already requires `tailwindcss` 4, and installs now share one `tailwind-merge` copy with `@docubook/core`.
