---
'@docubook/flame': patch
---

Fix sidebar border overlap and content layout centering

- **Separator mode**: level 1+ leaf items now use `-ml-[14px]` overlap wrapper so the active `border-primary` aligns at the ul's gray border edge, consistent with level 0 items
- **Dropdown mode**: level 1+ items get `border-l-2` at their natural indented position with `border-base-300` (inactive) / `border-primary` (active) — no overlap, tree structure visible
- **Dynamic overlap offset**: separator mode calculates accumulated offset based on nesting level (14px base + parent section padding per level), ensuring correct overlap at ul's edge for any depth
- **Typography**: removed `max-w-[500px]!` constraint so content fills available width
- **Content layout**: added centering wrapper (`2xl:mx-auto 2xl:max-w-[1300px]`) inside scroll-container so content + TOC stay centered on screens >1440px without shrinking the container
- **Fallback and dropdown modes**: aligned with same `border-base-300` ul + `-ml-[14px]` item structure as separator mode for consistency
- **DRY refactor**: extracted `renderBorderItem`, `navProps`, and `sharedUlClasses` in Menu.tsx to eliminate duplicated nav item rendering across modes
