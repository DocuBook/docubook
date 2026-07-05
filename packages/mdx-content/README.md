# @docubook/mdx-content

Portable MDX components and framework adapters for [DocuBook](https://docubook.pro/). Provides a collection of ready-to-use React components designed for MDX-based documentation sites, with built-in support for Next.js adapters.

## Installation

```bash
# npm
npm install @docubook/mdx-content

# pnpm
pnpm add @docubook/mdx-content

# yarn
yarn add @docubook/mdx-content

# bun
bun add @docubook/mdx-content
```

## Usage

### 1. Create a custom components registry

Create `lib/mdx/index.ts` to register your custom MDX components:

```ts
// lib/mdx/index.ts
import type { MdxComponentMap } from "@docubook/mdx-content";

export const customMdxComponents: MdxComponentMap = {
  // add your custom components here
};
```

### 2. Create the MDX components map

Create `lib/mdx-components.ts` to define the full component map. Import built-in components individually and merge them with your custom ones via `createMdxComponents`:

```ts
// lib/mdx-components.ts
import {
    createMdxComponents,
    type MdxComponentMap,
    AccordionsMdx,
    AccordionMdx,
    CardsMdx,
    ChangesMdx,
    CodeBlock,
    FileMdx,
    FilesMdx,
    FolderMdx,
    KbdMdx,
    NoteMdx,
    ReleaseMdx,
    StepsMdx,
    StepMdx,
    TabMdx,
    TabsMdx,
    TableBodyMdx,
    TableCellMdx,
    TableFooterMdx,
    TableHeadMdx,
    TableHeaderMdx,
    TableMdx,
    TableRowMdx,
    MermaidMdx,
    TooltipMdx,
    YoutubeMdx,
} from "@docubook/mdx-content";
import { ImageMdx, LinkMdx, ButtonMdx, CardMdx } from "@docubook/mdx-content/next";
import { customMdxComponents } from "@/lib/mdx";

const builtInOverrides: MdxComponentMap = {
    Tabs: TabsMdx,
    Tab: TabMdx,
    table: TableMdx,
    thead: TableHeaderMdx,
    tbody: TableBodyMdx,
    tfoot: TableFooterMdx,
    tr: TableRowMdx,
    th: TableHeadMdx,
    td: TableCellMdx,
    pre: CodeBlock,
    Button: ButtonMdx,
    Note: NoteMdx,
    Step: StepMdx,
    Steps: StepsMdx,
    Accordion: AccordionMdx,
    Accordions: AccordionsMdx,
    Card: CardMdx,
    Cards: CardsMdx,
    Kbd: KbdMdx,
    Release: ReleaseMdx,
    Changes: ChangesMdx,
    File: FileMdx,
    Files: FilesMdx,
    Folder: FolderMdx,
    Youtube: YoutubeMdx,
    Tooltip: TooltipMdx,
    Mermaid: MermaidMdx,
    img: ImageMdx,
    a: LinkMdx,
    Link: LinkMdx,
};

export const mdxComponents = createMdxComponents({
    ...builtInOverrides,
    ...customMdxComponents,
});
```

> For Next.js projects, import `Link`, `Button`, `Card`, and `Image` from `@docubook/mdx-content/next` to use Next.js-optimized versions (`next/link`, `next/image`).

### 3. Use the components map when rendering MDX

Pass `mdxComponents` to `createMdxContentService` from `@docubook/core`:

```ts
// lib/markdown.ts
import { createMdxContentService } from "@docubook/core";
import { cache } from "react";
import { mdxComponents as components } from "@/lib/mdx-components";

const docsService = createMdxContentService({
  parseOptions: { components },
  cacheFn: cache,
});
```

### Available import paths

|              Path              |                          Description                           |
| ------------------------------ | -------------------------------------------------------------- |
| `@docubook/mdx-content`        | All server-safe components + `createMdxComponents` registry    |
| `@docubook/mdx-content/client` | Client-only components (accordion, tabs, tooltip, mermaid, etc.)        |
| `@docubook/mdx-content/server` | Server-side components                                         |
| `@docubook/mdx-content/next`   | Next.js-optimized adapters (`Link`, `Button`, `Card`, `Image`) |
| `@docubook/mdx-content/styles.css` | Stylesheet for MDX components (required)                   |

> **Important:** You must import the stylesheet in your app's root layout or global CSS entry point:
>
> ```ts
> import "@docubook/mdx-content/styles.css";
> ```

---

## Custom Components

### 1. Create your component

Add a new file under `lib/mdx/`:

```tsx
// lib/mdx/Callout.tsx
export default function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50">
      {children}
    </div>
  );
}
```

### 2. Register your component

Import and add it to `customMdxComponents` in `lib/mdx/index.ts`:

```ts
// lib/mdx/index.ts
import type { MdxComponentMap } from "@docubook/mdx-content";
import Callout from "@/lib/mdx/Callout";

export const customMdxComponents: MdxComponentMap = {
  Callout,
};
```

`customMdxComponents` is already spread into `createMdxComponents` in `lib/mdx-components.ts`, so no further changes are needed. You can now use `<Callout>` in any `.mdx` file:

```mdx
<Callout>
  This is a custom callout component.
</Callout>
```

---

## Customization

All components expose stable CSS class names you can target for style overrides. Import `@docubook/mdx-content/styles.css` for base styles, then override as needed.

### CSS Classes

|              Class               |  Component   |                    Description                    |
| -------------------------------- | ------------ | ------------------------------------------------- |
| `.mdx-expandable-code`           | `CodeBlock`  | The `<pre>` element inside expandable code blocks |
| `.mdx-expandable-code-container` | `CodeBlock`  | Scroll container wrapping the `<pre>`             |
| `.code-block-container`          | `CodeBlock`  | Outer wrapper of the entire code block            |
| `.code-block-header`             | `CodeBlock`  | Header bar (filename, language label)             |
| `.code-block-actions`            | `CodeBlock`  | Action buttons area (copy button)                 |
| `.code-block-body`               | `CodeBlock`  | Body area containing the code                     |
| `.code-block-expandable-footer`  | `CodeBlock`  | Footer with expand/collapse toggle                |
| `.code-block-expandable-toggle`  | `CodeBlock`  | The expand/collapse button                        |
| `.docubook-card-group`           | `Cards`      | Grid container for card layouts                   |
| `[data-card-hover]`              | `Card`       | Card with link — target for hover styles          |
| `[data-card-icon]`               | `Card`       | Icon element inside a card                        |
| `.mdx-accordion`                 | `Accordion`  | Single accordion wrapper                          |
| `.mdx-accordion-group`           | `Accordions` | Group wrapper for multiple accordions             |
| `.mdx-accordion-group-item`      | `Accordion`  | Accordion when inside a group                     |
| `.mdx-accordion-header`          | `Accordion`  | Clickable header/trigger                          |
| `.mdx-accordion-chevron`         | `Accordion`  | Chevron icon in header                            |
| `.mdx-accordion-content`         | `Accordion`  | Collapsible content area                          |

### CSS Custom Properties

|             Variable             | Component |                       Description                        |
| -------------------------------- | --------- | -------------------------------------------------------- |
| `--docubook-card-group-template` | `Cards`   | Grid column template (set automatically via `cols` prop) |

---

## API Migration Policy

The current rename rollout uses a migration phase, not an immediate hard-breaking change:

- New tags are the primary API (`Accordions`, `Cards`, `Steps`, `Step`).
- Legacy tags are still supported as deprecated aliases for backward compatibility `only v2`(`AccordionGroup`, `CardGroup`, `Stepper`, `StepperItem`).
- A true breaking change happens when deprecated aliases are removed in a future major release. `v3 remove legacy API`

---

## Available Components

Components included out of the box:

- `Accordion` / `Accordions`
- `Button`
- `Card` / `Cards`
- Code Block (`pre`)
- `Files` / `Folder` / `File`
- `Image` / `img`
- `Kbd`
- `Link` / `a`
- `Note`
- `Release` / `Changes`
- `Steps` / `Step`
- `Tabs` / `Tab`
- `Tooltip`
- `Mermaid` — renders Mermaid.js diagrams (flowchart, sequence, class, state, gantt, pie, ER) from ` ```mermaid ` fenced code blocks, with GFM-style pan/zoom/fullscreen controls (button and keyboard driven)
- `Youtube`
- Table (`table`, `thead`, `tbody`, `tfoot`, `tr`, `th`, `td`)

---

## License

MIT — see [LICENSE](https://github.com/DocuBook/docubook/blob/main/packages/mdx-content/LICENSE) for details.
