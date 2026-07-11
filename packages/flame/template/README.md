<h1 align="center" style="font-size: 32px;">
  DocuBook Flame 🔥
</h1>
<h3 align="center" style="font-size: 20px;">
  Fast as flame — a Bun-native framework for modern documentation experiences.
</h3>

<p align="center">
  <strong>@docubook/flame</strong> is a lightweight runtime for building documentation websites using React, MDX, and filesystem-based routing — running on Bun, Node.js, and Deno.
</p>

---

> **Lightweight** — 📦 ~132 kB packed. No bloat, just fire.

---
## Quick Start

**Bun**
```bash
mkdir my-docs && cd my-docs
bun add @docubook/flame
bunx flame init
bun run dev
```

**Node.js**
```bash
mkdir my-docs && cd my-docs
npm install @docubook/flame
npx flame init
npm run dev
```

**Deno**
```bash
mkdir my-docs && cd my-docs
deno run -A npm:@docubook/flame init
deno task dev
```

---

## Documentation

For the full documentation, please visit **[packages/flame/docs](https://github.com/DocuBook/docubook/tree/main/packages/flame/docs)** or read the individual pages below:

### Getting Started

| Page                                                                                                                  | Description                                  |
| --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| [Welcome](https://github.com/DocuBook/docubook/blob/main/packages/flame/docs/index.mdx)                               | Overview and welcome to `@docubook/flame`.   |
| [Introduction](https://github.com/DocuBook/docubook/blob/main/packages/flame/docs/getting-started/introduction.mdx)   | Overview of the framework.                   |
| [Installation](https://github.com/DocuBook/docubook/blob/main/packages/flame/docs/getting-started/installation.mdx)   | Install and scaffold your first site.        |
| [Quick Start Guide](https://github.com/DocuBook/docubook/blob/main/packages/flame/docs/getting-started/quick-start-guide.mdx) | Get up and running in minutes.        |
| [Format text](https://github.com/DocuBook/docubook/blob/main/packages/flame/docs/getting-started/format-text.mdx)     | Markdown and inline styling in MDX.          |
| [Frontmatter](https://github.com/DocuBook/docubook/blob/main/packages/flame/docs/getting-started/frontmatter.mdx)     | Page metadata via frontmatter.               |
| [Themes](https://github.com/DocuBook/docubook/blob/main/packages/flame/docs/getting-started/themes.mdx)               | Color system, presets, and custom hex.       |
| [Plugins](https://github.com/DocuBook/docubook/blob/main/packages/flame/docs/getting-started/plugins.mdx)             | Extend the build and dev pipeline.           |
| [Deployment](https://github.com/DocuBook/docubook/blob/main/packages/flame/docs/getting-started/deployment.mdx)       | Deploy to static hosting with clean URLs.    |
| [Search — Built-in](https://github.com/DocuBook/docubook/blob/main/packages/flame/docs/getting-started/search/built-in.mdx) | Build-time full-text search.           |
| [Search — Algolia](https://github.com/DocuBook/docubook/blob/main/packages/flame/docs/getting-started/search/algolia.mdx) | Algolia DocSearch integration.         |

### Components

| Page                                                                                              | Description                              |
| ------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| [Accordion](https://github.com/DocuBook/docubook/blob/main/packages/flame/docs/components/accordion.mdx)               | Collapsible content sections.        |
| [Accordion Group](https://github.com/DocuBook/docubook/blob/main/packages/flame/docs/components/accordion-group.mdx)   | Group multiple accordions.           |
| [Button](https://github.com/DocuBook/docubook/blob/main/packages/flame/docs/components/button.mdx)                     | Action and navigation buttons.       |
| [Card](https://github.com/DocuBook/docubook/blob/main/packages/flame/docs/components/card.mdx)                         | Compact content cards.               |
| [Card Group](https://github.com/DocuBook/docubook/blob/main/packages/flame/docs/components/card-group.mdx)             | Display multiple cards together.     |
| [Code Block](https://github.com/DocuBook/docubook/blob/main/packages/flame/docs/components/code-block.mdx)             | Code snippets with line highlighting. |
| [Custom Components](https://github.com/DocuBook/docubook/blob/main/packages/flame/docs/components/custom.mdx)          | Register your own MDX components.    |
| [File Tree](https://github.com/DocuBook/docubook/blob/main/packages/flame/docs/components/file-tree.mdx)               | Hierarchical file structures.        |
| [Image](https://github.com/DocuBook/docubook/blob/main/packages/flame/docs/components/image.mdx)                       | Display images in Markdown.          |
| [Keyboard](https://github.com/DocuBook/docubook/blob/main/packages/flame/docs/components/keyboard.mdx)                 | Keyboard keys with platform styling. |
| [Link](https://github.com/DocuBook/docubook/blob/main/packages/flame/docs/components/link.mdx)                         | Navigation links.                    |
| [Mermaid](https://github.com/DocuBook/docubook/blob/main/packages/flame/docs/components/mermaid.mdx)                   | Mermaid.js diagrams in MDX.          |
| [Note](https://github.com/DocuBook/docubook/blob/main/packages/flame/docs/components/note.mdx)                         | Notes, warnings, and success messages. |
| [Release Note](https://github.com/DocuBook/docubook/blob/main/packages/flame/docs/components/release-note.mdx)         | Per-version update notes.            |
| [Stepper](https://github.com/DocuBook/docubook/blob/main/packages/flame/docs/components/stepper.mdx)                   | Step-by-step instructions.           |
| [Tables](https://github.com/DocuBook/docubook/blob/main/packages/flame/docs/components/tables.mdx)                     | GitHub-flavored tables.              |
| [Tabs](https://github.com/DocuBook/docubook/blob/main/packages/flame/docs/components/tabs.mdx)                         | Switchable content sections.         |
| [Tooltips](https://github.com/DocuBook/docubook/blob/main/packages/flame/docs/components/tooltips.mdx)                 | Hover info tooltips.                 |
| [Youtube](https://github.com/DocuBook/docubook/blob/main/packages/flame/docs/components/youtube.mdx)                   | Embed YouTube videos.                |

---

## License

MIT
