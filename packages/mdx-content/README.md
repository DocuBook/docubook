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
    AccordionGroupMdx,
    AccordionMdx,
    CardGroupMdx,
    ChangesMdx,
    CodeBlock,
    FileMdx,
    FilesMdx,
    FolderMdx,
    KbdMdx,
    NoteMdx,
    ReleaseMdx,
    StepperItemMdx,
    StepperMdx,
    TableBodyMdx,
    TableCellMdx,
    TableFooterMdx,
    TableHeadMdx,
    TableHeaderMdx,
    TableMdx,
    TableRowMdx,
    TabsContentMdx,
    TabsListMdx,
    TabsMdx,
    TabsTriggerMdx,
    TooltipMdx,
    YoutubeMdx,
} from "@docubook/mdx-content";
import { ImageMdx, LinkMdx, ButtonMdx, CardMdx } from "@docubook/mdx-content/next";
import { customMdxComponents } from "@/lib/mdx";

const builtInOverrides: MdxComponentMap = {
    Tabs: TabsMdx,
    TabsContent: TabsContentMdx,
    TabsList: TabsListMdx,
    TabsTrigger: TabsTriggerMdx,
    table: TableMdx,
    thead: TableHeaderMdx,
    tbody: TableBodyMdx,
    tfoot: TableFooterMdx,
    tr: TableRowMdx,
    th: TableHeadMdx,
    td: TableCellMdx,
    pre: CodeBlock,
    Card: CardMdx,
    Button: ButtonMdx,
    Note: NoteMdx,
    Stepper: StepperMdx,
    StepperItem: StepperItemMdx,
    Accordion: AccordionMdx,
    AccordionGroup: AccordionGroupMdx,
    CardGroup: CardGroupMdx,
    Kbd: KbdMdx,
    Release: ReleaseMdx,
    Changes: ChangesMdx,
    File: FileMdx,
    Files: FilesMdx,
    Folder: FolderMdx,
    Youtube: YoutubeMdx,
    Tooltip: TooltipMdx,
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
| `@docubook/mdx-content/client` | Client-only components (accordion, tabs, tooltip, etc.)        |
| `@docubook/mdx-content/server` | Server-side components                                         |
| `@docubook/mdx-content/next`   | Next.js-optimized adapters (`Link`, `Button`, `Card`, `Image`) |

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

## Available Components

For full usage examples of all built-in components, refer to [components.md](./components.md).

Components included out of the box:

- `Accordion` / `AccordionGroup`
- `Button`
- `Card` / `CardGroup`
- Code Block (`pre`)
- `Files` / `Folder` / `File`
- `Image` / `img`
- `Kbd`
- `Link` / `a`
- `Note`
- `Release` / `Changes`
- `Stepper` / `StepperItem`
- `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent`
- `Tooltip`
- `Youtube`
- Table (`table`, `thead`, `tbody`, `tfoot`, `tr`, `th`, `td`)

---

## License

MIT — see [LICENSE](./LICENSE) for details.
