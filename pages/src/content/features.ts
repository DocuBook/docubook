// Copy from the "DocuBook — Features" frame in docubook.pen; source: docs/getting-started/introduction.mdx "What Flame Brings".
// `icon` is the Lucide icon printed on the feature's tile in the puzzle board (kebab-case, see FeatureGrid).
export type Feature = {
  label: string;
  title: string;
  description: string;
  icon: string;
  highlight?: boolean;
};

export const features: Feature[] = [
  {
    label: "No runtime",
    icon: "hammer",
    title: "Build time only.",
    description:
      "Markdown compiles to flat static HTML. Bun, Node or Deno power the toolchain, never production.",
    highlight: true,
  },
  {
    label: "Markdown contract",
    icon: "file-text",
    title: "Write Markdown, not JSX.",
    description:
      "Common markdown plus a small set of directives. Readable in any editor, any diff, and by any agent.",
  },
  {
    label: "Directives",
    icon: "blocks",
    title: "Components by name.",
    description:
      "Callouts, tabs, cards, accordions, steps and file trees, written as markdown and resolved by Flame.",
  },
  {
    label: "Incremental builds",
    icon: "layers",
    title: "Only what changed.",
    description:
      "A content-hash build cache and deterministic bundle hashing recompile changed pages only.",
  },
  {
    label: "Dev server + HMR",
    icon: "zap",
    title: "Stay in the edit.",
    description:
      "Memoized compilation and instant reload on content changes. Repeat navigations never re-parse.",
  },
  {
    label: "Built-in search",
    icon: "search",
    title: "Found at build time.",
    description:
      "A full-text index generated during the build. Connect Algolia when you outgrow it.",
  },
  {
    label: "Plugin system",
    icon: "plug",
    title: "Hooks, not forks.",
    description: "Extend the build pipeline and dev server with hooks, registered from docu.json.",
    highlight: true,
  },
  {
    label: "Config-driven themes",
    icon: "palette",
    title: "One color. A whole theme.",
    description: "Switch presets or set custom colors in docu.json. Light and dark follow along.",
  },
  {
    label: "Eval-free hydration",
    icon: "shield-check",
    title: "A strict CSP, no exceptions.",
    description: "Content compiles to static ESM modules. No new Function, so no 'unsafe-eval'.",
  },
  {
    label: "Filesystem routing",
    icon: "folder-tree",
    title: "docs/ is the sitemap.",
    description:
      "Pages are discovered from the docs folder. Folders become sections, files become routes.",
  },
  {
    label: "Subpath ready",
    icon: "route",
    title: "/docs, a prefix, or root.",
    description:
      "Links, canonical URLs, search records and generated nginx rules follow the base path.",
  },
  {
    label: "Deploy anywhere",
    icon: "cloud-upload",
    title: "Just files.",
    description:
      "Static output for Netlify, Vercel, Cloudflare, nginx, or any host that serves HTML.",
  },
];
