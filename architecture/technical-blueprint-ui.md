# Technical Blueprint: @docubook/ui

> React + DaisyUI component library — universal across all React frameworks.

## Objective

Extract and publish the DaisyUI-wrapped React components from `packages/flame/.docu/components/base/` into a standalone, tree-shakeable library (`@docubook/ui`) consumable by Next.js, Remix, React Router v7, Astro, TanStack Start, and Vite + React.

---

## A1: Tech Stack Decision

### Decision Matrix

| Criteria (weight) | tsup | Vite lib mode | Rollup raw |
|-------------------|------|---------------|------------|
| Zero-config setup (3) | 9 | 6 | 3 |
| ESM + CJS + DTS output (3) | 9 | 7 | 8 |
| Auto peer externals (2) | 9 | 5 | 7 |
| Build speed (2) | 9 | 7 | 6 |
| Ecosystem familiarity (1) | 7 | 9 | 6 |
| **Weighted total** | **97** | **71** | **64** |

### Selected Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Build** | tsup 8 (esbuild) | Auto externals, ESM+CJS+DTS, minimal config |
| **Runtime** | React ≥18 (peer) | Covers React 18 + 19 ecosystem |
| **Styling** | Tailwind CSS 4 + DaisyUI 5 (peer) | CSS-only, no JS runtime cost |
| **Icons** | lucide-react (peer) | Already used in flame, tree-shakeable |
| **Utilities** | Custom `cn()` (bundled) | No external deps (no clsx/tailwind-merge) |
| **Testing** | Vitest + @testing-library/react | Already in monorepo |
| **Types** | TypeScript 5.9, strict mode | Exported interfaces for all props |

### Peer Dependencies (consumer must install)

```
react >= 18.0.0
tailwindcss >= 4.0.0
daisyui >= 5.0.0
lucide-react >= 1.0.0
```

---

## A2: Architecture

### Component Categories

| Category | Components | Characteristics |
|----------|-----------|-----------------|
| **Primitives** | Input, Kbd, Toggle | Thin wrappers, forwardRef, spread props |
| **Composites** | Modal, Drawer, Collapse, Dropdown | State management, compound pattern |
| **Navigation** | Navbar, Breadcrumbs, Pagination | Layout-aware, responsive |
| **Controllers** | ThemeController | Side-effect (DOM class manipulation) |

### Design Principles

1. **Headless-compatible** — DaisyUI classes applied via `className`, overridable
2. **forwardRef all primitives** — consumers can attach refs
3. **Compound components** — `<Collapse>` + `<Accordion>` pattern, not config objects
4. **No internal routing** — no `<Link>`, no framework-specific navigation
5. **SSR-safe** — no `window` access without guard, no `useLayoutEffect` without check
6. **"use client" only when needed** — components with hooks get the directive

### Directory Structure

```
packages/ui/
├── package.json
├── tsup.config.ts
├── tsconfig.json
├── README.md
├── CHANGELOG.md
├── src/
│   ├── index.ts                        # Barrel export
│   ├── cn.ts                           # Utility (bundled)
│   ├── types.ts                        # Shared types
│   ├── modal/
│   │   ├── index.ts                    # Re-export
│   │   └── modal.tsx                   # Modal, ModalAction, useModal
│   ├── drawer/
│   │   ├── index.ts
│   │   └── drawer.tsx                  # Drawer, DrawerTrigger, DrawerContent
│   ├── collapse/
│   │   ├── index.ts
│   │   ├── collapse.tsx                # Collapse
│   │   └── accordion.tsx              # Accordion (multi-collapse)
│   ├── dropdown/
│   │   ├── index.ts
│   │   └── dropdown.tsx
│   ├── navbar/
│   │   ├── index.ts
│   │   └── navbar.tsx                  # Navbar, NavMenu, NavToggle, Logo
│   ├── breadcrumbs/
│   │   ├── index.ts
│   │   └── breadcrumbs.tsx
│   ├── pagination/
│   │   ├── index.ts
│   │   ├── pagination.tsx
│   │   └── types.ts
│   ├── toggle/
│   │   ├── index.ts
│   │   └── toggle.tsx                  # ToggleGroup
│   ├── input/
│   │   ├── index.ts
│   │   └── input.tsx
│   ├── kbd/
│   │   ├── index.ts
│   │   └── kbd.tsx
│   └── theme-controller/
│       ├── index.ts
│       └── theme-controller.tsx        # ThemeController variants
└── __tests__/
    ├── modal.test.tsx
    ├── collapse.test.tsx
    ├── drawer.test.tsx
    └── ...
```

### Export Strategy

```jsonc
// package.json exports
{
  ".": "./dist/index.js",           // Barrel (all components)
  "./modal": "./dist/modal/index.js",
  "./drawer": "./dist/drawer/index.js",
  "./collapse": "./dist/collapse/index.js",
  "./dropdown": "./dist/dropdown/index.js",
  "./navbar": "./dist/navbar/index.js",
  "./breadcrumbs": "./dist/breadcrumbs/index.js",
  "./pagination": "./dist/pagination/index.js",
  "./toggle": "./dist/toggle/index.js",
  "./input": "./dist/input/index.js",
  "./kbd": "./dist/kbd/index.js",
  "./theme-controller": "./dist/theme-controller/index.js",
  "./cn": "./dist/cn.js"
}
```

### Consumer Usage

```tsx
// Tree-shaken import (recommended)
import { Modal, useModal } from "@docubook/ui/modal";
import { Collapse, Accordion } from "@docubook/ui/collapse";

// Barrel import (convenience)
import { Modal, Collapse, Drawer } from "@docubook/ui";
```

### Framework Compatibility Notes

| Framework | Notes |
|-----------|-------|
| **Next.js** | `"use client"` directive preserved in output — works with App Router |
| **Remix / RR7** | No RSC, all components work as-is |
| **Astro** | Use `client:load` or `client:visible` on islands |
| **TanStack Start** | Standard React, no special handling |
| **Vite + React** | SPA, all components work directly |

---

## A6: Execution Roadmap

### Sprint 1 — Scaffolding & Core (3 days)

| # | Task | Output |
|---|------|--------|
| 1.1 | Create `packages/ui/` with package.json, tsconfig, tsup.config | Buildable empty package |
| 1.2 | Implement `cn.ts` utility | Bundled helper |
| 1.3 | Implement shared `types.ts` | Common prop interfaces |
| 1.4 | Setup Vitest config | Test runner ready |
| 1.5 | Add to pnpm workspace + Turborepo pipeline | Integrated in monorepo |

### Sprint 2 — Primitive Components (3 days)

| # | Task | Output |
|---|------|--------|
| 2.1 | Port `input.tsx` → `src/input/` | forwardRef Input |
| 2.2 | Port `kbd.tsx` → `src/kbd/` | Kbd component |
| 2.3 | Port `toggle.tsx` → `src/toggle/` | ToggleGroup |
| 2.4 | Port `dropdown.tsx` → `src/dropdown/` | Dropdown |
| 2.5 | Write tests for primitives | 4 test files |

### Sprint 3 — Composite Components (4 days)

| # | Task | Output |
|---|------|--------|
| 3.1 | Port `modal.tsx` → `src/modal/` | Modal + useModal |
| 3.2 | Port `drawer.tsx` → `src/drawer/` | Drawer compound |
| 3.3 | Port `collapse.tsx` → `src/collapse/` | Collapse + Accordion |
| 3.4 | Port `theme-controller.tsx` → `src/theme-controller/` | ThemeController |
| 3.5 | Write tests for composites | 4 test files |

### Sprint 4 — Navigation Components (3 days)

| # | Task | Output |
|---|------|--------|
| 4.1 | Port `navbar.tsx` → `src/navbar/` | Navbar, NavMenu, NavToggle |
| 4.2 | Port `breadcrumbs.tsx` → `src/breadcrumbs/` | Breadcrumb compound |
| 4.3 | Port `pagination/` → `src/pagination/` | Pagination + types |
| 4.4 | Write tests for navigation | 3 test files |

### Sprint 5 — Build, Docs & Publish (2 days)

| # | Task | Output |
|---|------|--------|
| 5.1 | Verify tsup build output (ESM + CJS + DTS) | Clean dist/ |
| 5.2 | Test consumption in Next.js, Vite, Astro projects | Verified compatibility |
| 5.3 | Write README with install + usage examples | Documentation |
| 5.4 | Add Changesets config | Versioning ready |
| 5.5 | Publish v0.1.0 to npm | Live package |

### Sprint 6 — Integration (2 days)

| # | Task | Output |
|---|------|--------|
| 6.1 | Replace flame `base/` imports with `@docubook/ui` | flame uses published package |
| 6.2 | Replace rerouter base components with `@docubook/ui` | rerouter uses published package |
| 6.3 | Update architecture docs | Docs in sync |

---

## Trade-offs & Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| DaisyUI breaking changes (v5→v6) | Component classes break | Pin peer dep range `>=5 <6`, test on upgrade |
| `cn()` tanpa tailwind-merge | Class conflicts possible | Document: last class wins, consumer can override |
| `"use client"` in output | Astro needs explicit island directive | Document in README, no workaround needed |
| No SSR theme flash handling | ThemeController needs framework-specific script | Provide `getThemeScript()` helper, consumer injects |
| lucide-react bundle size | Adds icons to consumer bundle | Peer dep, tree-shaken by consumer's bundler |

---

## Scope Boundaries

### v0.1.0 (this plan)
- ✅ All `base/` components from flame
- ✅ TypeScript strict, exported types
- ✅ ESM + CJS + DTS
- ✅ Per-component import paths

### Future (not in scope)
- ❌ Storybook / docs site
- ❌ CSS-in-JS alternative
- ❌ Headless mode (no DaisyUI)
- ❌ Animation library integration
- ❌ Form library bindings (react-hook-form, etc.)
