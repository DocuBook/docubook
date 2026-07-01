---
"@docubook/flame": minor
---

Add `sidebar.context` configuration with two modes: "dropdown" (default) and "separator"

**Schema & types:**
- Add `sidebar` object to `docu.schema.json` with `context` enum `["dropdown", "separator"]`, default `"dropdown"`
- Add `DocuSidebar` interface and optional `sidebar` field to `DocuConfig`

**Separator mode components:**
- New `SidebarGroupHeader` — renders icon (Lucide) + title for each context section
- Separator branch in `Menu.tsx` — filters routes with `context`, renders headers + tree connector + nav items
- `Context.tsx` returns `null` in separator mode (context switcher not needed)

**Visual:**
- Icon wrapped in styled span matching Context.tsx dropdown pattern
- Padding aligned with level-0 Sublink items
- Tree connector line (`border-l-2`) connecting section header to its items
- Tight spacing between header and items

**Backward compatible:**
- Absent `sidebar` or `sidebar.context === "dropdown"` preserves existing behavior
- Dropdown mode code path unchanged
- Sublink.tsx behavior unchanged
- All 291 tests pass
