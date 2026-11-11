import { presetRegistry } from "@docubook/themes-colors";

// Copy for the homepage sections, taken from the pen.dev design (docubook.pen).
export type Step = {
  label: string;
  artifact: string;
  title: string;
  description: string;
  icon: string;
  highlight?: boolean;
};

export const pipeline: Step[] = [
  {
    label: "Author",
    artifact: "index.md",
    icon: "file-pen-line",
    title: "Write Markdown",
    description:
      "CommonMark and directives. Content you can read, edit, and keep in your repository.",
  },
  {
    label: "Compile",
    artifact: ".md → .html",
    icon: "flame",
    title: "Let Flame build",
    description: "DocuBook Flame compiles your documentation into flat static HTML files.",
    highlight: true,
  },
  {
    label: "Deploy",
    artifact: "static host",
    icon: "upload",
    title: "Choose your host",
    description: "Publish the generated files wherever you serve a static website.",
  },
  {
    label: "Read",
    artifact: "your-docs.com",
    icon: "globe",
    title: "Open in a browser",
    description: "Documentation, delivered. No application server to keep running.",
  },
];

export const pluginSteps: Step[] = [
  {
    label: "Configure",
    artifact: "docu.json",
    icon: "file-pen-line",
    title: "Register in docu.json",
    description:
      "Add a plugins array: an npm package, a factory with options, or a local file in plugins/.",
  },
  {
    label: "Setup",
    artifact: "setup(build)",
    icon: "flame",
    title: "Write a setup function",
    description: "A plugin is a name and a setup(build) call. Register only the hooks you need.",
    highlight: true,
  },
  {
    label: "Hook",
    artifact: "injectHead(ctx)",
    icon: "upload",
    title: "Hook the pipeline",
    description:
      "onStart, transformFrontmatter, injectHead, transformHtml, onEnd. They run in docu.json order.",
  },
  {
    label: "Ship",
    artifact: "@docubook/plugin-*",
    icon: "globe",
    title: "Share or keep local",
    description: "Keep it in your project or publish to npm. Hooks run on Bun, Node and Deno.",
  },
];

export const demoSource = [
  "---",
  "title: Introduction",
  "description: Flame is a build-time bridge, not a runtime.",
  "---",
  "",
  "## Why Flame Exists",
  "",
  "Flame takes a different approach: it is **not a runtime**.",
  "It compiles Markdown into flat static HTML.",
  "",
  ':::info{title="Contribute"}',
  "  Want to contribute? Visit our [GitHub repository](/gh).",
  ":::",
  "",
  "## v2 Direction: Write Markdown, Not JSX",
  "",
  "Content is **plain markdown** — common markdown and directives.",
];

// Commands mirror packages/flame/docs/getting-started/installation.mdx.
export const quickstart = {
  comments: [
    "# 01  Install the compiler",
    "# 02  Initialize your documentation",
    "# 03  Start developing",
  ],
  runtimes: [
    { name: "Bun", commands: ["bun add @docubook/flame", "bunx flame init", "bun run dev"] },
    { name: "Node.js", commands: ["npm install @docubook/flame", "npx flame init", "npm run dev"] },
    {
      name: "Deno",
      commands: [
        "deno add npm:@docubook/flame",
        "deno run -A npm:@docubook/flame init",
        "deno task dev",
      ],
    },
  ],
};

export const hosts = [
  { icon: "cloud-upload", title: "A static hosting service", hint: "Upload your HTML" },
  { icon: "server", title: "Your own infrastructure", hint: "Serve the same files" },
];

export const outputTree = ["├─ index.html", "├─ quickstart.html", "├─ guides.html", "└─ assets/"];

// Each preset's primary color, read from the package so the swatches cannot drift from it.
export const themePresets = Object.entries(presetRegistry).map(([name, { variables }]) => ({
  name,
  color: `hsl(${variables.root.primary})`,
}));
