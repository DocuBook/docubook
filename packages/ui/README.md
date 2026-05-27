# @docubook/ui

React + DaisyUI component library for documentation sites. Works with **Next.js**, **Remix**, **React Router v7**, **Astro**, **TanStack Start**, and **Vite + React**.

## Install

```bash
pnpm add @docubook/ui
```

### Peer Dependencies

```bash
pnpm add react tailwindcss daisyui lucide-react
```

| Peer | Version |
|------|---------|
| react | ≥ 18.0.0 |
| tailwindcss | ≥ 4.0.0 |
| daisyui | ≥ 5.0.0 |
| lucide-react | ≥ 1.0.0 (optional) |

## Usage

```tsx
// Per-component import (tree-shaken)
import { Modal, useModal } from "@docubook/ui/modal";
import { Collapse, Accordion } from "@docubook/ui/collapse";
import { ThemeController, useTheme } from "@docubook/ui/theme-controller";

// Barrel import
import { Modal, Collapse, Input, Navbar } from "@docubook/ui";
```

## Components

### Primitives

| Component | Import Path | Description |
|-----------|-------------|-------------|
| `Input`, `InputGroup` | `@docubook/ui/input` | Input with color/size/ghost variants |
| `Kbd` | `@docubook/ui/kbd` | Keyboard key indicator |
| `Toggle`, `ToggleGroup` | `@docubook/ui/toggle` | Toggle switch with label/description |
| `Dropdown`, `DropdownItem`, `DropdownLink` | `@docubook/ui/dropdown` | Details-based dropdown menu |

### Composites

| Component | Import Path | Description |
|-----------|-------------|-------------|
| `Modal`, `ModalAction`, `useModal` | `@docubook/ui/modal` | Native dialog modal |
| `Drawer`, `DrawerTrigger`, `useDrawerState` | `@docubook/ui/drawer` | Responsive sidebar drawer |
| `Collapse`, `Accordion` | `@docubook/ui/collapse` | Collapsible content panels |
| `ThemeController`, `useTheme` | `@docubook/ui/theme-controller` | Theme switcher (toggle/select/radio) |

### Navigation

| Component | Import Path | Description |
|-----------|-------------|-------------|
| `Navbar`, `NavMenu`, `Logo`, `NavToggle` | `@docubook/ui/navbar` | Navigation bar with slots |
| `Breadcrumb`, `BreadcrumbItem`, `BreadcrumbLink` | `@docubook/ui/breadcrumbs` | Breadcrumb navigation |
| `Pagination`, `PaginationFull`, `PaginationDocs` | `@docubook/ui/pagination` | Page navigation |

### Utilities

| Export | Import Path | Description |
|--------|-------------|-------------|
| `cn()` | `@docubook/ui/cn` | Class name merging utility |

## Framework Setup

### Next.js (App Router)

Components with hooks include `"use client"` — works out of the box.

### Astro

```astro
---
import { Modal } from "@docubook/ui/modal";
---
<Modal client:load>...</Modal>
```

### React Router v7 / Remix / Vite

No special setup needed — standard React components.

## License

MIT
