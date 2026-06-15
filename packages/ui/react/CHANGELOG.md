# @docubook/ui-react

## 0.1.4

### Patch Changes

- [#225](https://github.com/DocuBook/docubook/pull/225) [`f7997c4`](https://github.com/DocuBook/docubook/commit/f7997c43138abe36c7b4f5f5e2d8dea7a0cb5613) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - fix: bump vitest to 4.1.8 and add esbuild override for GHSA-gv7w-rqvm-qjhr

  Update vitest and `@vitest/coverage-v8` to latest patch versions, and add
  `esbuild` override via pnpm-workspace.yaml to resolve a high-severity
  security advisory (GHSA-gv7w-rqvm-qjhr) — missing binary integrity
  verification in the Deno module, patched in esbuild >=0.28.1.

## 0.1.3

### Minor Changes

- feat(kbd): add `FnKey.configure()` for optional Lucide icon support
  - `FnKey.configure({ Command, ChevronUp, ... })` enables Lucide icons globally
  - HTML entities remain the default when `configure()` is not called
  - Partial configuration supported — unconfigured keys fall back to HTML entities
  - Exports `FnKeyIcons` interface for typed icon configuration
  - `lucide-react` remains an optional peer dependency — zero bundle impact without it

## 0.1.2

### Patch Changes

- fix(packages): correct NavMenu activePath delimiter matching
  - Fix false positive active state by requiring `/` delimiter after href prefix
  - Add tests for nested child active state and false positive guard

## 0.1.1

### Patch Changes

- refactor(ui-react): fix cn utility, use client directives, trim pagination
  - Replace `cn()` plain join with `clsx` + `tailwind-merge`
  - Add `clsx@2.1.1` and `tailwind-merge@2.6.1` as dependencies
  - Remove global `use client` banner from `tsup.config.ts`
  - Add `"use client"` directly to `input.tsx` and `kbd.tsx` source files
  - Remove unused pagination components — keep only `PaginationDocs`
  - Clean up related exports in `index.ts`

- fix(ui): remove redundant label in form components

## 0.1.0

### Minor Changes

- feat(ui-react): initial release — React + DaisyUI component library
  - Restructure `packages/ui` → `packages/ui/react` with flat `src/base/` layout
  - Components: `Input`, `InputGroup`, `Kbd`, `FnKey`, `Toggle`, `ToggleGroup`,
    `Dropdown`, `DropdownItem`, `DropdownLink`, `Modal`, `useModal`, `Drawer`,
    `Collapse`, `Accordion`, `ThemeControllerToggle`, `Navbar`, `Logo`,
    `NavMenu`, `NavMenuLink`, `Breadcrumb`, `BreadcrumbItem`, `BreadcrumbList`,
    `BreadcrumbPage`, `PaginationDocs`
  - Per-component tree-shakeable imports via subpath exports
  - `cn()` utility via `@docubook/ui-react/cn`
  - `lucide-react` declared as optional peer dependency
  - `PaginationDocs` supports `prevIcon`, `nextIcon`, `linkClassName` props
  - `Dropdown` supports `menuClassName` prop
  - 83 tests passing
