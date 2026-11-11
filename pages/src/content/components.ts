// Copy from the "DocuBook — Components" frame in docubook.pen. Syntax mirrors packages/flame/docs/components/*.mdx;
// `slug` is the component's page under /docs/components. Each specimen pairs the Markdown `source` with `render`,
// what the drawing beside it shows: components.test.ts fails when a rendered text is not in its source.
export const specimens = [
  {
    kind: "callout",
    name: "Callout",
    slug: "callout",
    source: `:::tip{title="Custom title"}
Callout content goes here.
:::

:::info
This is a general note.
:::`,
    // `type` picks the icon and color; a callout without a title shows its type.
    render: [
      { type: "tip", title: "Custom title", body: "Callout content goes here." },
      { type: "info", body: "This is a general note." },
    ],
  },
  {
    kind: "tabs",
    name: "Tabs",
    slug: "tabs",
    source: `::::tabs
:::tab{title="Java"}
\`\`\`java:HelloWorld.java
System.out.println("Hello");
\`\`\`
:::
:::tab{title="TypeScript"}
\`\`\`typescript:helloWorld.ts
console.log("Hello");
\`\`\`
:::
::::`,
    render: [
      { title: "Java", file: "HelloWorld.java", code: 'System.out.println("Hello");' },
      { title: "TypeScript", file: "helloWorld.ts", code: 'console.log("Hello");' },
    ],
  },
  {
    kind: "steps",
    name: "Steps",
    slug: "steps",
    source: `::::steps
:::step{title="Clone the repository"}
\`\`\`bash
git clone …/docubook.git
\`\`\`
:::
:::step{title="Install dependencies"}
\`\`\`bash
bun install
\`\`\`
:::
::::`,
    render: [
      { title: "Clone the repository", command: "git clone …/docubook.git" },
      { title: "Install dependencies", command: "bun install" },
    ],
  },
  {
    kind: "cards",
    name: "Card group",
    slug: "card-group",
    source: `::::cards{cols="2"}
:::card{title="Heading 1" icon="Heading1"}
Card content with columns.
:::
:::card{title="Heading 2" icon="Heading2"}
Card content with columns.
:::
::::`,
    render: [
      { icon: "heading-1", title: "Heading 1", body: "Card content with columns." },
      { icon: "heading-2", title: "Heading 2", body: "Card content with columns." },
    ],
  },
  {
    kind: "accordion",
    name: "Accordion",
    slug: "accordion",
    source: `:::accordion{title="Click to expand"}
A simple accordion that can be
toggled by clicking the header.
:::`,
    render: {
      title: "Click to expand",
      body: "A simple accordion that can be toggled by clicking the header.",
    },
  },
  {
    kind: "tree",
    name: "File tree",
    slug: "file-tree",
    source: `\`\`\`filetree
my-app/
  src/
    App.tsx
  package.json
  README.md
\`\`\``,
    render: {
      root: "my-app",
      folder: "src",
      nested: "App.tsx",
      files: ["package.json", "README.md"],
    },
  },
] as const;

export const moreComponents = [
  {
    name: "Code block",
    slug: "code-block",
    description: "Titles, line numbers and highlighted lines on any fence.",
    syntax: "```js:main.js showLineNumbers {3-4}",
  },
  {
    name: "Mermaid",
    slug: "mermaid",
    description: "Flowcharts, sequence and state diagrams from a fenced block.",
    syntax: "```mermaid",
  },
  {
    name: "Tables",
    slug: "tables",
    description: "GitHub-flavored tables, styled.",
    syntax: "| Column | Column |",
  },
  {
    name: "Tooltips",
    slug: "tooltips",
    description: "Extra detail on a word, inline in a paragraph.",
    syntax: ':tooltip[word]{tip="…"}',
  },
  {
    name: "Image",
    slug: "image",
    description: "Images written the Markdown way.",
    syntax: "![Alt text](/image.png)",
  },
  {
    name: "Link",
    slug: "link",
    description: "Links to pages and to other sites.",
    syntax: "[Text](https://…)",
  },
  {
    name: "YouTube",
    slug: "youtube",
    description: "A video embedded by its id.",
    syntax: '::youtube{videoId="…"}',
  },
  {
    name: "Accordion group",
    slug: "accordion-group",
    description: "Several accordions grouped together.",
    syntax: "::::accordions",
  },
  {
    name: "Card",
    slug: "card",
    description: "A single card with an icon, a link, or a horizontal layout.",
    syntax: ':::card{title="…" icon="…"}',
  },
];
