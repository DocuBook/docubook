# Creating DaisyUI Components

## Table of Contents
- [Bootstrapping Foundational Files](#bootstrapping-foundational-files)
- [Directory Structure](#directory-structure)
- [Simple Component Pattern](#simple-component-pattern)
- [Compound Component Pattern](#compound-component-pattern)
- [Registering in daisy-meta.ts](#registering-in-daisy-metats)
- [Safelist Integration](#safelist-integration)
- [Testing Components](#testing-components)

---

## Bootstrapping Foundational Files

Before creating any component, verify these files exist. If missing, create them from the bundled `scripts/` templates.

### Checklist

| File | Source | Purpose |
|------|--------|---------|
| `<DAISY_COMPONENTS_DIR>/daisy-meta.ts` | Bundled `scripts/daisy-meta.ts` | Central metadata & types |
| `generators/daisy/generate-daisy-safelist.ts` | Bundled `scripts/generate-daisy-safelist.ts` | Safelist CSS generator |
| `src/app/styles/daisy-safelist.css` | Auto-generated | Prevents Tailwind tree-shaking |
| `src/app/styles/daisy.css` | Create manually | daisyUI plugin + safelist import |
| `package.json` `"generate:safelist"` script | Add manually | Runs the generator |

### 1. Create daisy-meta.ts

Copy the bundled `scripts/daisy-meta.ts` to `<DAISY_COMPONENTS_DIR>/daisy-meta.ts`. No modifications needed — it works as-is.

### 2. Create generate-daisy-safelist.ts

Copy the bundled `scripts/generate-daisy-safelist.ts` to `generators/daisy/generate-daisy-safelist.ts`. **Update the import path** to point to the actual `daisy-meta.ts` location:

```ts
// Before (bundled path):
import { ... } from "./daisy-meta.ts";

// After (adjust to match your project structure):
import { ... } from "../../src/components/daisy/daisy-meta.ts";
```

### 3. Create daisy.css

Create `src/app/styles/daisy.css`:

```css
@plugin "daisyui" {
  themes: light --default, dark --prefersdark;
}
@import 'daisy-safelist.css';
```

Adjust the `themes` line to match project requirements. This file must be imported in the root layout or global CSS entry point (e.g. `layout.tsx` or `globals.css`).

### 4. Add npm script

Add to `package.json`:

```json
{
  "scripts": {
    "generate:safelist": "npx tsx generators/daisy/generate-daisy-safelist.ts"
  }
}
```

### 5. Generate initial safelist

```bash
npm run generate:safelist
```

This creates `src/app/styles/daisy-safelist.css` with all registered component classes.

### Keeping files updated

When adding a new component:
1. Add its entry to `COMPONENT_CAPABILITIES` in `daisy-meta.ts`
2. Run `npm run generate:safelist` to regenerate the safelist
3. If the component uses a new capability type not in `ComponentCapability`, update both `daisy-meta.ts` (add the type) and `generate-daisy-safelist.ts` (add iteration in `buildClassList()`)

---

## Directory Structure

```
<DAISY_COMPONENTS_DIR>/
├── daisy-meta.ts                 # Central metadata (source of truth)
├── daisy-badge.tsx               # Simple component (single file)
├── daisy-card/                   # Compound component (directory)
│   ├── index.ts                  # Public barrel export
│   ├── daisy-card.tsx            # Root compound component
│   ├── daisy-card-body.tsx       # Sub-component
│   ├── daisy-card-title.tsx      # Sub-component
│   ├── daisy-card-actions.tsx    # Sub-component
│   └── daisy-card.test.tsx       # Tests
├── daisy-modal/                  # Another compound component
│   ├── index.ts
│   ├── daisy-modal.tsx
│   ├── daisy-modal-box.tsx
│   ├── daisy-modal-action.tsx
│   ├── daisy-modal-backdrop.tsx
│   └── daisy-modal.test.tsx
```

- Simple components: single `.tsx` file (e.g. `daisy-badge.tsx`)
- Compound components: directory with one file per sub-component + barrel `index.ts`

---

## Simple Component Pattern

Use for single-element daisyUI components (badge, loading, status, kbd, link, etc.).

```tsx
// daisy-badge.tsx
import { type HTMLAttributes, forwardRef } from "react";
import { type DaisyColor, type DaisySize } from "./daisy-meta";

export interface DaisyBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: DaisyColor;
  size?: DaisySize;
  variant?: "outline" | "dash" | "soft" | "ghost";
}

export const DaisyBadge = forwardRef<HTMLSpanElement, DaisyBadgeProps>(
  ({ color, size, variant, className = "", children, ...props }, ref) => {
    const classes = [
      "badge",
      color && `badge-${color}`,
      size && `badge-${size}`,
      variant && `badge-${variant}`,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <span ref={ref} className={classes} {...props}>
        {children}
      </span>
    );
  }
);
DaisyBadge.displayName = "DaisyBadge";
```

**Key rules:**
- Use `forwardRef` for all components
- Set `displayName` explicitly
- Spread `...props` and merge `className`
- Build class strings from props using the `component-modifier` pattern
- Import types from `daisy-meta.ts`

---

## Compound Component Pattern

Use for multi-part daisyUI components (card, modal, dropdown, navbar, drawer, alert, chat, stat, etc.). Each sub-component is a separate file.

### Root component file

```tsx
// daisy-card/daisy-card.tsx
import { type HTMLAttributes, forwardRef } from "react";
import { type DaisySize } from "../daisy-meta";

export interface DaisyCardProps extends HTMLAttributes<HTMLDivElement> {
  size?: DaisySize;
  variant?: "border" | "dash";
  imageFull?: boolean;
  horizontal?: boolean;
}

export const DaisyCard = forwardRef<HTMLDivElement, DaisyCardProps>(
  ({ size, variant, imageFull, horizontal, className = "", children, ...props }, ref) => {
    const classes = [
      "card",
      size && `card-${size}`,
      variant && `card-${variant}`,
      imageFull && "image-full",
      horizontal && "card-side",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  }
);
DaisyCard.displayName = "DaisyCard";
```

### Sub-component files

```tsx
// daisy-card/daisy-card-body.tsx
import { type HTMLAttributes, forwardRef } from "react";

export interface DaisyCardBodyProps extends HTMLAttributes<HTMLDivElement> {}

export const DaisyCardBody = forwardRef<HTMLDivElement, DaisyCardBodyProps>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <div ref={ref} className={`card-body ${className}`.trim()} {...props}>
        {children}
      </div>
    );
  }
);
DaisyCardBody.displayName = "DaisyCardBody";
```

```tsx
// daisy-card/daisy-card-title.tsx
import { type HTMLAttributes, forwardRef } from "react";

export interface DaisyCardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

export const DaisyCardTitle = forwardRef<HTMLHeadingElement, DaisyCardTitleProps>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <h2 ref={ref} className={`card-title ${className}`.trim()} {...props}>
        {children}
      </h2>
    );
  }
);
DaisyCardTitle.displayName = "DaisyCardTitle";
```

```tsx
// daisy-card/daisy-card-actions.tsx
import { type HTMLAttributes, forwardRef } from "react";
import { type DaisyAlignment } from "../daisy-meta";

export interface DaisyCardActionsProps extends HTMLAttributes<HTMLDivElement> {
  align?: DaisyAlignment;
}

export const DaisyCardActions = forwardRef<HTMLDivElement, DaisyCardActionsProps>(
  ({ align = "end", className = "", children, ...props }, ref) => {
    const classes = [
      "card-actions",
      align && `justify-${align}`,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  }
);
DaisyCardActions.displayName = "DaisyCardActions";
```

### Barrel export (index.ts)

```tsx
// daisy-card/index.ts
export { DaisyCard, type DaisyCardProps } from "./daisy-card";
export { DaisyCardBody, type DaisyCardBodyProps } from "./daisy-card-body";
export { DaisyCardTitle, type DaisyCardTitleProps } from "./daisy-card-title";
export { DaisyCardActions, type DaisyCardActionsProps } from "./daisy-card-actions";
```

### Usage example

```tsx
import { DaisyCard, DaisyCardBody, DaisyCardTitle, DaisyCardActions } from "@/components/daisy/daisy-card";

<DaisyCard size="md" className="bg-base-100 shadow-sm w-96">
  <figure><img src="https://picsum.photos/400/200" alt="Cover" /></figure>
  <DaisyCardBody>
    <DaisyCardTitle>Product Name</DaisyCardTitle>
    <p>Product description here.</p>
    <DaisyCardActions align="end">
      <button className="btn btn-primary">Buy Now</button>
    </DaisyCardActions>
  </DaisyCardBody>
</DaisyCard>
```

### When to use compound vs simple

| Pattern | Use when |
|---------|----------|
| **Simple** (single file) | Component is one element with modifiers: badge, loading, status, kbd, divider, progress |
| **Compound** (directory) | Component has named child parts in daisyUI docs: card (card-body, card-title, card-actions), modal (modal-box, modal-action, modal-backdrop), alert (with icon + text + actions), stat (stat-title, stat-value, stat-desc), chat (chat-bubble, chat-header, chat-footer), navbar (navbar-start, navbar-center, navbar-end), dropdown (dropdown-content), collapse (collapse-title, collapse-content), steps (step) |

---

## Registering in daisy-meta.ts

Every new component must be added to `COMPONENT_CAPABILITIES` in `daisy-meta.ts`. Reference the daisyUI component docs for supported modifiers.

```ts
// Example: adding alert
export const COMPONENT_CAPABILITIES: Partial<Record<string, ComponentCapability>> = {
  // ... existing entries ...
  alert: {
    colors: true,             // alert-info, alert-success, etc.
    variants: ["outline", "dash", "soft"],
    orientation: true,        // alert-horizontal, alert-vertical
  },
  steps: {
    colors: true,             // step-primary, step-secondary, etc.
    orientation: true,        // steps-horizontal, steps-vertical
  },
  toggle: {
    colors: true,
    sizes: true,
  },
  loading: {
    sizes: true,
  },
};
```

**Rules:**
- Set `colors: true` if the component supports `component-primary`, `component-secondary`, etc.
- Set `sizes: true` if it supports `component-xs` through `component-xl`
- Use an array for `variants` if only a subset applies: `["ghost", "outline"]`
- Set `variants: true` if all standard variants apply (dash, outline, ghost, link, soft)
- Set `orientation: true` if it supports `component-horizontal`/`component-vertical`
- Set `placement` array for positional modifiers: `["top", "bottom", "left", "right"]`
- Omit properties that don't apply — don't set them to `false`

---

## Safelist Integration

After registering the component in `daisy-meta.ts` and creating the component files:

1. Run the safelist generator:
```bash
npm run generate:safelist
```

2. Verify the generated `src/app/styles/daisy-safelist.css` includes your new component classes.

3. Ensure the import chain is intact:
```css
/* src/app/styles/daisy.css */
@plugin "daisyui" {
  themes: "theme-name --default, theme-dark --prefersdark;";
}
@import 'daisy-safelist.css';
```

4. The `daisy.css` file must be imported in the root layout or a global CSS entry point.

If your component uses a new capability type not yet in `ComponentCapability`, update both `daisy-meta.ts` (add the type) and `generate-daisy-safelist.ts` (add iteration in `buildClassList()`).

---

## Testing Components

Use the project's existing test framework. Check `package.json` for `jest`, `vitest`, or `@testing-library/react`. Default to Jest + React Testing Library.

### Example test pattern

```tsx
import { render, screen } from "@testing-library/react";
import { DaisyBadge } from "./daisy-badge";

describe("DaisyBadge", () => {
  it("renders with base class", () => {
    render(<DaisyBadge>Test</DaisyBadge>);
    expect(screen.getByText("Test")).toHaveClass("badge");
  });

  it("applies color prop", () => {
    render(<DaisyBadge color="primary">Test</DaisyBadge>);
    expect(screen.getByText("Test")).toHaveClass("badge", "badge-primary");
  });

  it("merges custom className", () => {
    render(<DaisyBadge className="mt-4">Test</DaisyBadge>);
    expect(screen.getByText("Test")).toHaveClass("badge", "mt-4");
  });

  it("forwards ref", () => {
    const ref = { current: null } as React.RefObject<HTMLSpanElement>;
    render(<DaisyBadge ref={ref}>Test</DaisyBadge>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });
});
```

### What to test

For every component, cover:
- Base class always present on render
- Each prop variation (color, size, variant, shape, placement) applies correct class
- Custom `className` merges without overwriting base class
- `ref` forwarding returns correct element type

For compound components, additionally test:
- Each sub-component renders its part class (`card-body`, `modal-box`, etc.)
- Full composition renders all parts together correctly
- Accessibility attributes (`role`, `aria-*`) where applicable
