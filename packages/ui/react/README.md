# @docubook/ui-react

React + DaisyUI component library for documentation sites. Works with **Next.js**, **Remix**, **React Router v7**, **Astro**, **TanStack Start**, and **Vite + React**.

## Install

```bash
pnpm add @docubook/ui-react
```

### Peer Dependencies

```bash
pnpm add react tailwindcss daisyui lucide-react
```

|     Peer     |      Version       |
| ------------ | ------------------ |
| react        | ≥ 18.0.0           |
| tailwindcss  | ≥ 4.0.0            |
| daisyui      | ≥ 5.0.0            |
| lucide-react | ≥ 1.0.0 (optional) |

## Usage

```tsx
// Per-component import (tree-shaken)
import { Modal, useModal } from "@docubook/ui-react/modal";
import { Collapse, Accordion } from "@docubook/ui-react/collapse";
import { ThemeControllerToggle } from "@docubook/ui-react/theme-controller";
import { cn } from "@docubook/ui-react/cn";

// Barrel import
import { Modal, Collapse, Input, Navbar } from "@docubook/ui-react";
```

## Components

### Primitives

|                 Component                  |          Import Path          |                  Description                   |
| ------------------------------------------ | ----------------------------- | ---------------------------------------------- |
| `Input`, `InputGroup`                      | `@docubook/ui-react/input`    | Input with color/size/ghost variants           |
| `Kbd`, `FnKey`                             | `@docubook/ui-react/kbd`      | Keyboard key indicator with function key icons |
| `Toggle`, `ToggleGroup`                    | `@docubook/ui-react/toggle`   | Toggle switch with label/description           |
| `Dropdown`, `DropdownItem`, `DropdownLink` | `@docubook/ui-react/dropdown` | Details-based dropdown menu                    |

#### FnKey with Lucide Icons

`FnKey` renders HTML entities by default. Call `FnKey.configure()` once at your app entry point to use Lucide icons instead:

```tsx
// app/layout.tsx or main.tsx
import {
  Command, Option, ChevronUp, ArrowBigUp,
  CircleArrowOutUpLeft, Space, Delete, ArrowRightToLine,
  ChevronDown, ChevronLeft, ChevronRight,
} from "lucide-react";
import { FnKey } from "@docubook/ui-react/kbd";

FnKey.configure({
  Command, Option, ChevronUp, ArrowBigUp,
  CircleArrowOutUpLeft, Space, Delete, ArrowRightToLine,
  ChevronDown, ChevronLeft, ChevronRight,
});
```

Then use `FnKey` anywhere — icons are applied globally:

```tsx
import { Kbd, FnKey } from "@docubook/ui-react/kbd";

<Kbd><FnKey.Cmd /></Kbd>   // → Command icon
<Kbd><FnKey.Shift /></Kbd> // → ArrowBigUp icon
```

Without `configure()`, all keys fall back to HTML entities automatically.

#### PaginationDocs with Custom Icons

```tsx
import { PaginationDocs } from "@docubook/ui-react/pagination";
import { ChevronLeft, ChevronRight } from "lucide-react";

<PaginationDocs
  prev={{ href: "/prev", title: "Previous Page" }}
  next={{ href: "/next", title: "Next Page" }}
  prevIcon={<ChevronLeft className="w-3 h-3" />}
  nextIcon={<ChevronRight className="w-3 h-3" />}
/>
```

### Composites

|                                    Component                                    |              Import Path              |              Description              |
| ------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------- |
| `Modal`, `useModal`                                                             | `@docubook/ui-react/modal`            | Native dialog modal with hook         |
| `Drawer`, `DrawerTrigger`, `DrawerSidePanel`, `DrawerContent`, `useDrawerState` | `@docubook/ui-react/drawer`           | Responsive sidebar drawer             |
| `Collapse`, `Accordion`                                                         | `@docubook/ui-react/collapse`         | Collapsible content panels            |
| `ThemeControllerToggle`                                                         | `@docubook/ui-react/theme-controller` | Theme toggle switch with render props |

### Navigation

|                                                              Component                                                               |           Import Path            |        Description        |
| ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------- | ------------------------- |
| `Navbar`, `Logo`, `NavMenu`, `NavMenuLink`                                                                                           | `@docubook/ui-react/navbar`      | Navigation bar components |
| `Breadcrumb`, `BreadcrumbItem`, `BreadcrumbPage`, `BreadcrumbList`                                                                   | `@docubook/ui-react/breadcrumbs` | Breadcrumb navigation     |
| `PaginationDocs`                                                                                               | `@docubook/ui-react/pagination`  | Page navigation utilities |

### Utilities

| Export |       Import Path       |                    Description                     |
| ------ | ----------------------- | -------------------------------------------------- |
| `cn()` | `@docubook/ui-react/cn` | Class name merging utility (clsx + tailwind-merge) |

## Framework Setup

### Next.js (App Router)

Components with hooks include `"use client"` — works out of the box.

### Astro

```astro
---
import { Modal } from "@docubook/ui-react/modal";
---
<Modal client:load>...</Modal>
```

### React Router v7 / Remix / Vite

No special setup needed — standard React components.

### TanStack Start

No special setup needed — standard React components.

## CSS Requirements

### Dropdown Component

The `Dropdown` component uses native `<details>` element. To hide the default disclosure marker, add this CSS to your global stylesheet:

```css
/* globals.css */
summary::-webkit-details-marker {
  display: none;
}
summary::marker {
  display: none;
}
```

## License

MIT
