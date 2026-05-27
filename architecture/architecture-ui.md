# Architecture Design: @docubook/ui

> Internal architecture of the React + DaisyUI component library.

---

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          @docubook/ui                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────── Utilities (bundled) ──────────────────────────┐  │
│  │  cn.ts          — class merging (no external deps)            │  │
│  │  types.ts       — shared prop types (Size, Color, Side)       │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────── Primitives (forwardRef) ──────────────────────┐  │
│  │                                                               │  │
│  │  Input       Kbd       Toggle       Dropdown                  │  │
│  │  ─────       ───       ──────       ────────                  │  │
│  │  <input>     <kbd>     <input       <details>                 │  │
│  │  wrapper     wrapper    checkbox>    + <summary>              │  │
│  │                         + label                               │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────── Composites (stateful) ────────────────────────┐  │
│  │                                                               │  │
│  │  Modal              Drawer             Collapse               │  │
│  │  ─────              ──────             ────────               │  │
│  │  <dialog>           checkbox toggle    useState open/close    │  │
│  │  + useModal()       + overlay          + Accordion (multi)    │  │
│  │  + ModalAction      + DrawerTrigger                           │  │
│  │                     + DrawerSidePanel                         │  │
│  │                                                               │  │
│  │  ThemeController                                              │  │
│  │  ───────────────                                              │  │
│  │  useTheme() + localStorage                                    │  │
│  │  Toggle / Select / Radio variants                             │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────── Navigation ───────────────────────────────────┐  │
│  │                                                               │  │
│  │  Navbar             Breadcrumbs        Pagination             │  │
│  │  ──────             ───────────        ──────────             │  │
│  │  NavbarContainer    BreadcrumbList     PaginationFull         │  │
│  │  NavMenu            BreadcrumbItem     PaginationRange        │  │
│  │  NavToggle          BreadcrumbLink     getPaginationRange()   │  │
│  │  Logo               BreadcrumbPage                            │  │
│  │  NavbarVersion                                                │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  Peer Dependencies (NOT bundled)                                    │
│  react ≥18 │ tailwindcss ≥4 │ daisyui ≥5 │ lucide-react ≥1        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Component Rendering Flow

```
Consumer App
     │
     │  import { Modal } from "@docubook/ui/modal"
     ▼
┌──────────────┐
│  Props In    │  className, children, placement, closeOnBackdrop
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  cn() merge  │  DaisyUI base class + variant class + user className
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  React DOM   │  <dialog class="modal modal-middle user-class">
└──────────────┘
```

### State Flow (Composites)

```
┌─────────────────────────────────────────────────────────┐
│  Internal State (useState)                              │
│                                                         │
│  Collapse:  isOpen → toggle → onOpenChange callback     │
│  Drawer:    isOpen → checkbox input → CSS :checked      │
│  Modal:     ref → showModal()/close() (native dialog)   │
│  Theme:     theme → localStorage → document.classList   │
└─────────────────────────────────────────────────────────┘
         │
         │  Props callback (onOpenChange, onThemeChange)
         ▼
┌─────────────────────────────────────────────────────────┐
│  Consumer State (controlled or uncontrolled)            │
└─────────────────────────────────────────────────────────┘
```

### Build Output Flow

```
src/**/*.tsx
     │
     │  tsup (esbuild)
     ▼
dist/
├── index.js          (ESM barrel)
├── index.cjs         (CJS barrel)
├── index.d.ts        (TypeScript declarations)
├── cn.js + cn.d.ts
├── modal/
│   ├── index.js      (ESM)
│   ├── index.cjs     (CJS)
│   └── index.d.ts
├── drawer/
│   └── ...
└── [component]/
    └── ...
```

---

## Architecture Decision Records

### ADR-UI-001: Custom `cn()` Without tailwind-merge

**Context:** Existing flame uses a custom `cn()` that filters falsy values and joins. Libraries like shadcn use `clsx` + `tailwind-merge` (12KB).

**Decision:** Bundle a custom `cn()` — no external dependencies.

**Rationale:**
- DaisyUI uses semantic classes (`btn-primary`, `modal-top`), not conflicting utilities
- tailwind-merge solves `p-2 p-4` conflicts — rare in DaisyUI wrapper usage
- Zero dependency = smaller install, no version conflicts

**Trade-off:** If consumer passes conflicting Tailwind utilities, last-in-source wins (CSS specificity), not last-in-className. Acceptable for DaisyUI semantic patterns.

---

### ADR-UI-002: Uncontrolled-First with Controlled Escape Hatch

**Context:** Components like Collapse and Drawer manage open/close state. Should they be controlled or uncontrolled?

**Decision:** Uncontrolled by default (`defaultOpen` + internal state), with `onOpenChange` callback for controlled usage.

**Rationale:**
- Most consumers just want a working collapse — no state wiring needed
- `onOpenChange` callback lets advanced consumers sync external state
- Matches DaisyUI's native behavior (checkbox-driven)

**Trade-off:** No fully-controlled mode (passing `open` prop that overrides internal state). Can be added in v0.2 if needed.

---

### ADR-UI-003: `"use client"` Directive Strategy

**Context:** Next.js App Router requires `"use client"` for components using hooks. Other frameworks ignore it.

**Decision:** Add `"use client"` at the top of every component file that uses `useState`, `useEffect`, or `useRef`. Primitives without hooks (pure render) omit it.

**Rationale:**
- tsup preserves the directive in output (banner option)
- Next.js needs it; other frameworks safely ignore it
- Granular: only stateful components are marked

**Trade-off:** Primitives like Input (forwardRef only, no hooks) won't have the directive — if consumer wraps them in a Server Component, it works. If they add a ref, they need their own `"use client"`.

---

### ADR-UI-004: No Internal Routing or Framework Coupling

**Context:** Navbar and Pagination could use `<Link>` from Next.js, React Router, etc.

**Decision:** Render plain `<a>` tags or accept `as` / `component` prop for link elements. No framework-specific imports.

**Rationale:**
- Library must work in 6+ frameworks — cannot import from any specific router
- Consumer wraps with their framework's Link: `<NavMenu as={Link} href="/docs">`
- Keeps peer deps minimal

**Trade-off:** Consumer must provide their own Link component for client-side navigation. Small DX cost, but necessary for universality.

---

### ADR-UI-005: DaisyUI Class Composition Pattern

**Context:** How should components apply DaisyUI classes?

**Decision:** Base DaisyUI class always applied. Variant classes derived from props. Consumer `className` appended last via `cn()`.

```tsx
// Pattern:
cn("btn", color && `btn-${color}`, size && `btn-${size}`, className)
```

**Rationale:**
- Predictable: base → variant → override
- Consumer can always override with their own classes
- Maps 1:1 to DaisyUI documentation

**Trade-off:** Consumer cannot remove the base class (e.g., cannot use `<Modal>` without `modal` class). Acceptable — that's the component's identity.

---

## Scalability & Reliability

### Growth Path

| Phase | Components | Strategy |
|-------|-----------|----------|
| v0.1 | 11 (current base/) | Direct port from flame |
| v0.2 | +5 (Card, Badge, Alert, Tooltip, Avatar) | New primitives |
| v0.3 | +3 (Tabs, Steps, Timeline) | Compound components |
| v1.0 | 20+ stable | Semver guarantee |

### Bundle Size Control

- Per-component entry points → consumer only bundles what they import
- No side effects (`"sideEffects": false` in package.json)
- lucide-react icons tree-shaken by consumer's bundler
- `cn()` is ~200 bytes — negligible

### Testing Reliability

| Layer | What | Tool |
|-------|------|------|
| Unit | Props → rendered output | Vitest + @testing-library/react |
| Type | Exported interfaces compile | `tsc --noEmit` |
| Build | Output structure correct | Vitest snapshot of dist/ |
| Integration | Works in Next.js/Vite/Astro | Manual verification (Sprint 5) |

---

## Security

| Concern | Approach |
|---------|----------|
| XSS via className | `cn()` only joins strings — no `dangerouslySetInnerHTML`, no eval |
| Theme localStorage | Read/write only `"theme"` key — no sensitive data |
| Supply chain | Published via Changesets, pinned deps, `pnpm audit` in CI |
| No network calls | Library is purely presentational — zero fetch/XHR |
