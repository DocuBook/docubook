# @docubook/markdown

Portable MDX components and the component registry for [DocuBook](https://docubook.pro/). Components are authored as markdown directives, not JSX — the registry maps directive names to React components and is consumed by the Flame build (or any MDX renderer that accepts a components map).

## Installation

```bash
# npm
npm install @docubook/markdown

# pnpm
pnpm add @docubook/markdown

# yarn
yarn add @docubook/markdown

# bun
bun add @docubook/markdown
```

## Usage

### 1. Create the components map

`createMdxComponents` returns the built-in component map; pass your own components to extend or override it:

```ts
// lib/mdx-components.ts
import { createMdxComponents, type MdxComponentMap } from "@docubook/markdown";

const customComponents: MdxComponentMap = {
  // optional: add or override components here
};

export const mdxComponents = createMdxComponents(customComponents);
```

### 2. Pass the map when rendering MDX

```tsx
// e.g. with @docubook/core's MDXRemote
import { MDXRemote } from "@docubook/core";
import { mdxComponents } from "@/lib/mdx-components";

export function Doc({ serialized }) {
  return <MDXRemote {...serialized} components={mdxComponents} />;
}
```

### 3. Import the stylesheet

Required — import it in your app's root layout or global CSS entry point:

```ts
import "@docubook/markdown/styles.css";
```

### Available import paths

|                Path                |                     Description                      |
| ---------------------------------- | ---------------------------------------------------- |
| `@docubook/markdown`               | The registry (`createMdxComponents`, `MdxComponentMap`) |
| `@docubook/markdown/styles.css`    | Stylesheet for the built-in components (required)    |

## Built-in components

Built-ins are registered under these keys and authored as directives (the v2 authoring contract — no JSX tags):

| Registry key                          | Authored as                                                                 |
| ------------------------------------- | --------------------------------------------------------------------------- |
| `Tab` / `Tabs`                        | `:::tab` / `::::tabs`                                                       |
| `Accordion` / `Accordions`            | `:::accordion` / `::::accordions`                                           |
| `Card` / `Cards`                      | `:::card` / `::::cards`                                                     |
| `Step` / `Steps`                      | `:::step` / `::::steps`                                                     |
| `Tree`                                | `::::tree`                                                                  |
| `Youtube`                             | `::youtube{videoId="…"}`                                                    |
| `Tooltip`                             | `:tooltip[label]{tip="…"}`                                                  |
| `Mermaid`                             | fenced `mermaid` code block                                                 |
| `Tip` / `Info` / `Warning` / `Danger` / `Success` | `:::tip` / `:::info` / `:::warning` / `:::danger` / `:::success` |
| `pre` / `img` / `Image` / `a` / `Link` | markdown elements — rendered as `CodeBlock`, `ImageMdx`, `LinkMdx`         |
| `table` / `thead` / `tbody` / `tfoot` / `tr` / `th` / `td` | markdown tables — rendered as the table components       |

### GFM alerts

GitHub alert blockquotes render through the same callout components, with the GitHub label as title:

| Markdown          | Renders as                        |
| ----------------- | --------------------------------- |
| `> [!NOTE]`       | `Info`                            |
| `> [!TIP]`        | `Tip`                             |
| `> [!IMPORTANT]`  | `GfmImportant` (GitHub purple)    |
| `> [!WARNING]`    | `Warning`                         |
| `> [!CAUTION]`    | `Danger`                          |

`GfmImportant` exists for GFM alerts only — deliberately not registered as `Important`, so `:::important` is not a directive.

## Custom components

Add a component and register it through the map:

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

```ts
// lib/mdx-components.ts
import { createMdxComponents, type MdxComponentMap } from "@docubook/markdown";
import Callout from "@/lib/mdx/Callout";

const customComponents: MdxComponentMap = {
  Callout,
};

export const mdxComponents = createMdxComponents(customComponents);
```

The component is now available in `.mdx` files, and custom entries override built-ins on key conflicts.

---

## Customization

All components expose stable CSS class names you can target for style overrides. Import `@docubook/markdown/styles.css` for base styles, then override as needed.

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

## License

MIT — see [LICENSE](https://github.com/DocuBook/docubook/blob/main/packages/markdown/LICENSE) for details.
