# @docubook/mdx-content

## 2.0.0

### Major Changes

- 067fb05: refactor(mdx-content): update Tabs, Kbd, AccordionGroup, Steps, and Cards to new API
  - Refactored TabsMdx to new <Tabs>/<Tab> API, improved content scoping, and updated design.
  - Refactored KbdMdx to enforce show prop only (no children). 
  - Refactored AccordionGroupMdx to use new AccordionsMdx API, with legacy alias for migration. 
  - Refactored StepsMdx/StepMdx for new stepper API, with legacy alias (StepperMdx) for migration. 
  - Refactored CardMdx and related card components to new API, with legacy alias for migration. 
  - Updated component registry to map new and legacy components for smooth migration.
