---
"@docubook/core": major
"@docubook/flame": major
"@docubook/markdown": major
"@docubook/themes-colors": major
"@docubook/ui-react": major
---

**v2 breaking changes — markdown-native authoring, eval-free hydration**

- **`@docubook/mdx-content` renamed to `@docubook/markdown`** — package is
  markdown components + directives (scope: docubook). Old name stays
  published and deprecated for existing users.
- Eval-free MDX hydration (static ESM modules, no `new Function`),
  `'unsafe-eval'` dropped from CSPs.
- `@docubook/mdx-remote` merged into `@docubook/core` (RSC path removed);
  `@docubook/runt` merged into flame. Both deprecated on npm.
