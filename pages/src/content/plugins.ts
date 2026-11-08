// Copy from the "DocuBook — Plugins" frame in docubook.pen. Versions come from the plugin packages themselves.
import ogPkg from "../../../plugins/og-image/package.json";
import algoliaPkg from "../../../plugins/search-algolia/package.json";

export const officialPlugins = {
  ogImage: {
    pkg: ogPkg.name,
    version: `v${ogPkg.version}`,
    title: "Social cards,\nrendered at build.",
    description:
      "Every page gets a 1200×630 OpenGraph image built from its frontmatter. Takumi renders it natively, no browser involved.",
    chips: ["No browser", "Hashed file names", "Only changed cards"],
  },
  algolia: {
    pkg: algoliaPkg.name,
    version: `v${algoliaPkg.version}`,
    title: "DocSearch,\nplus Ask AI.",
    description:
      "Algolia DocSearch v5 behind Flame's own search bar and ⌘ K. Full-text results in the dialog, Ask AI in its own panel beside the document.",
    chips: ["⌘ K search", "⌘ I Ask AI", "Search-only key"],
  },
};

export const searchResults = [
  {
    before: "Deploy to ",
    match: "nginx",
    after: " on a subpath",
    crumb: "Deployment / nginx",
    active: true,
  },
  { before: "Generated ", match: "nginx", after: " rules", crumb: "Getting started / Base path" },
  { before: "Your call: ", match: "nginx", after: " or Netlify", crumb: "Pages / Overview" },
];

export const examplePlugin = `import type { DocuBookPlugin } from "@docubook/flame";

const plugin: DocuBookPlugin = {
  name: "last-updated",
  setup(build) {
    build.transformFrontmatter((fm) => ({
      ...fm,
      updated: new Date().toISOString(),
    }));
  },
};

export default plugin;`;
