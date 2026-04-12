---
"@docubook/core": minor
---

feat(core): add expandable code block support ;

- Extract handleCodeTitles plugin to separate file
- Add handleCodeExpandableRemark to parse "Expandable" keyword from MDX code fence
- Add handleCodeExpandable (rehype) to copy expandable attributes to pre element
- Integrate both plugins in createDefaultRehypePlugins and createDefaultRemarkPlugins
- Add handleCodeTitles.ts to plugins