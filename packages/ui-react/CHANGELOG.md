# @docubook/ui-react

## 2.0.0-beta.2

### Patch Changes

- [#356](https://github.com/DocuBook/docubook/pull/356) [`5be00ec`](https://github.com/DocuBook/docubook/commit/5be00ec629d8452aec67bda080a4497177c3ac3a) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - Migrate the DocuBook package suite to Vite 8, Rolldown, and native ESM.

  ### `@docubook/core`
  - Switched the library build from `tsup` to Vite 8 with TypeScript declaration output.
  - Preserved the existing ESM entry points and export map structure.
  - Added an explicit `MDXRemote` return type to keep declaration output portable.

  ### `@docubook/flame`
  - Switched the Node and Deno compatibility compiler in `bin/compile-lib.mjs` from `esbuild` to Vite 8 with Rolldown, keeping ESM output in `.docu/lib`.
  - Kept the main runtime pipeline Bun-native and limited Vite/Rolldown to the compatibility build path.
  - Updated the Vitest config to use `import.meta.dirname` for native ESM config loading.
  - Fixed the plugin integration test to await its async assertion cleanly under newer Vitest behavior.

  ### `@docubook/markdown`
  - Switched the library build from `tsup` to Vite 8 with TypeScript declaration output.
  - Preserved the package's ESM-first output while aligning it with the new workspace build flow.

  ### `@docubook/themes-colors`
  - Switched the library build from `tsup` to Vite 8 with TypeScript declaration output.
  - Kept the same public API while continuing to ship native ESM output.

  ### `@docubook/ui-react`
  - Switched the multi-entry library build from `tsup` to Vite 8 with TypeScript declaration output.
  - Simplified the package to native ESM output only and removed CommonJS export conditions.
  - Preserved existing component subpath entry points such as `input`, `dropdown`, `modal`, and `navbar`.

## 2.0.0-alpha.0

### Major Changes

- **v2 breaking changes — markdown-native authoring, eval-free hydration**

  - **`@docubook/mdx-content` renamed to `@docubook/markdown`** — package is
    markdown components + directives (scope: docubook). Old name stays
    published and deprecated for existing users.
  - Eval-free MDX hydration (static ESM modules, no `new Function`),
    `'unsafe-eval'` dropped from CSPs.
  - `@docubook/mdx-remote` merged into `@docubook/core` (RSC path removed);
    `@docubook/runt` merged into flame. Both deprecated on npm.

## 1.0.0

### Major Changes

- Mark `@docubook/ui-react` as stable. The component API (Collapse, Modal, Dropdown, Drawer, Input, Kbd, Navbar, Pagination, Toggle, ThemeController, Breadcrumbs) is feature-complete and production-ready. This is an API-stability signal, not a behavioral change — no breaking changes relative to `0.1.4`.

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
