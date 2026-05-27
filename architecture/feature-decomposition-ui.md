# Feature Decomposition: @docubook/ui

> Atomic task breakdown for building the React + DaisyUI component library.

---

## Task Table

| # | Task | Description | Effort | Dependencies | Acceptance Criteria |
|---|------|-------------|--------|--------------|---------------------|
| 1 | Package scaffolding | Create `packages/ui/` with package.json, tsconfig.json, tsup.config.ts, add to pnpm workspace | S | — | `pnpm build --filter @docubook/ui` runs without error, outputs empty dist/ |
| 2 | Implement `cn()` utility | Port custom class-merge utility to `src/cn.ts`, no external deps | S | 1 | Exports `cn()`, handles falsy values, joins strings with space |
| 3 | Define shared types | Create `src/types.ts` with Size, Color, Side, common prop patterns | S | 1 | Types importable from `@docubook/ui`, no runtime code |
| 4 | Setup Vitest | Add vitest.config.ts, jsdom environment, @testing-library/react | S | 1 | `pnpm test --filter @docubook/ui` runs (0 tests, no error) |
| 5 | Port Input component | Move `input.tsx` → `src/input/`, replace `cn` import, add forwardRef | S | 2, 3 | Renders `<input>` with DaisyUI classes, ref forwarding works |
| 6 | Port Kbd component | Move `kbd.tsx` → `src/kbd/`, decouple from flame paths | S | 2, 3 | Renders `<kbd>` with size/color variants |
| 7 | Port Toggle component | Move `toggle.tsx` → `src/toggle/`, preserve forwardRef + indeterminate | M | 2, 3 | Toggle renders with label, color, size; indeterminate state works |
| 8 | Port Dropdown component | Move `dropdown.tsx` → `src/dropdown/` | S | 2, 3 | Renders `<details>` with DaisyUI dropdown classes |
| 9 | Port Modal component | Move `modal.tsx` → `src/modal/`, include useModal hook + ModalAction | M | 2, 3 | `useModal()` returns ref/open/close; dialog opens/closes correctly |
| 10 | Port Drawer component | Move `drawer.tsx` → `src/drawer/`, include DrawerTrigger, DrawerSidePanel, useDrawerState | M | 2, 3 | Drawer opens/closes, side prop works, overlay dismisses |
| 11 | Port Collapse + Accordion | Move `collapse.tsx` → `src/collapse/`, both Collapse and Accordion | M | 2, 3 | Collapse toggles, Accordion allows single/multi open, onOpenChange fires |
| 12 | Port ThemeController | Move `theme-controller.tsx` → `src/theme-controller/`, include useTheme | M | 2, 3 | useTheme reads/writes localStorage, Toggle/Select/Radio variants render |
| 13 | Port Navbar | Move `navbar.tsx` → `src/navbar/`, NavbarContainer, NavMenu, NavToggle, Logo, NavbarVersion | M | 2, 3 | All sub-components render, no router dependency |
| 14 | Port Breadcrumbs | Move `breadcrumbs.tsx` → `src/breadcrumbs/`, compound pattern | S | 2, 3 | BreadcrumbList > BreadcrumbItem > BreadcrumbLink renders correctly |
| 15 | Port Pagination | Move `pagination/` → `src/pagination/`, include types + getPaginationRange | M | 2, 3 | PaginationFull renders page numbers, range logic correct |
| 16 | Write tests — Primitives | Tests for Input, Kbd, Toggle, Dropdown | M | 5, 6, 7, 8 | ≥1 positive + ≥1 negative test per component, all pass |
| 17 | Write tests — Composites | Tests for Modal, Drawer, Collapse, ThemeController | M | 9, 10, 11, 12 | Open/close behavior tested, callbacks verified |
| 18 | Write tests — Navigation | Tests for Navbar, Breadcrumbs, Pagination | M | 13, 14, 15 | Renders correct structure, pagination range logic tested |
| 19 | Barrel exports + exports map | Create `src/index.ts` barrel, configure package.json `exports` field per component | S | 5–15 | `import { Modal } from "@docubook/ui"` and `from "@docubook/ui/modal"` both resolve |
| 20 | Verify build output | Run tsup, validate ESM + CJS + DTS for all entry points | S | 19 | dist/ contains .js, .cjs, .d.ts per component; no bundled peer deps |
| 21 | Framework compatibility test | Import in Next.js, Vite, Astro minimal projects — verify renders | M | 20 | Components render without error in 3 frameworks |
| 22 | README + usage docs | Install instructions, peer deps, import examples, component list | S | 20 | README covers install, setup, and usage for all 6 frameworks |
| 23 | Changesets + publish config | Add changeset config, `prepublishOnly` script, `files` field | S | 20 | `changeset version` + `pnpm publish` works |
| 24 | Replace flame base/ imports | Update flame to import from `@docubook/ui` instead of local base/ | M | 20 | flame builds and runs with library imports, no local base/ references |
| 25 | Replace rerouter base imports | Update rerouter to import from `@docubook/ui` | M | 20 | rerouter builds with library imports |

---

## Implementation Order

```
Phase 1: Foundation (Tasks 1–4)          ← parallel
     │
     ▼
Phase 2: Primitives (Tasks 5–8)          ← parallel
     │
     ▼
Phase 3: Composites (Tasks 9–12)         ← parallel
     │
     ▼
Phase 4: Navigation (Tasks 13–15)        ← parallel
     │
     ▼
Phase 5: Testing (Tasks 16–18)           ← parallel
     │
     ▼
Phase 6: Package & Publish (Tasks 19–23) ← sequential
     │
     ▼
Phase 7: Integration (Tasks 24–25)       ← parallel
```

---

## Parallel Work Opportunities

| Parallel Group | Tasks | Condition |
|---------------|-------|-----------|
| Foundation | 1, 2, 3, 4 | Task 1 first (creates package), then 2/3/4 parallel |
| Primitives | 5, 6, 7, 8 | All independent once cn() + types exist |
| Composites | 9, 10, 11, 12 | All independent once cn() + types exist |
| Navigation | 13, 14, 15 | All independent |
| Testing | 16, 17, 18 | Each depends on its component group |
| Integration | 24, 25 | Independent of each other |

**Maximum parallelism:** 4 tasks simultaneously (Phase 2–4).

---

## Risk Flags

| Risk | Task(s) | Mitigation |
|------|---------|------------|
| **ThemeController SSR** — `localStorage` access in SSR environments | 12 | Guard with `typeof window !== "undefined"`, document SSR usage |
| **"use client" preservation** — tsup might strip directives | 9–12 | Use tsup `banner` option: `{ js: '"use client"' }` per entry, verify in output |
| **Drawer checkbox pattern** — relies on CSS `:checked` which some test envs don't support | 10, 17 | Use `@testing-library/user-event` for realistic interaction |
| **Pagination logic** — `getPaginationRange()` has edge cases (1 page, 100+ pages) | 15, 18 | Port existing tests from flame, add boundary cases |
| **Peer dep version range** — DaisyUI v5 class names may change in v6 | All | Pin `"daisyui": ">=5.0.0 <6.0.0"` in peerDependencies |
| **Circular export** — barrel re-exports could cause bundler issues | 19 | Test with `--dts-resolve` flag, verify no circular in output |
