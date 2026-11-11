export const site = {
  name: "DocuBook",
  description:
    "A markdown-first documentation framework. Write with directives, compile to flat static HTML. No runtime, no server, no lock-in.",
  github: "https://github.com/DocuBook/docubook",
  npm: "https://www.npmjs.com/package/@docubook/flame",
  // Donate button in the Resources menu: the first channel in .github/FUNDING.yml.
  sponsor: "https://github.com/sponsors/gitfromwildan",
  nav: [
    { label: "Home", href: "/" },
    { label: "Features", href: "/features" },
  ],
  // The Resources menu. `external` marks a link into /docs, a separate Flame build that needs a full page load.
  resources: [
    {
      label: "Documentation",
      description: "Guides, configuration and reference.",
      href: "/docs",
      icon: "book-open",
      external: true,
    },
    {
      label: "Components",
      description: "Fifteen components, written as Markdown.",
      href: "/components",
      icon: "blocks",
    },
    {
      label: "Plugins",
      description: "Hook the build. Never fork it.",
      href: "/plugins",
      icon: "plug",
    },
    { label: "Themes", description: "One color. A whole theme.", href: "/themes", icon: "palette" },
    {
      label: "Deploy",
      description: "Just files. Any static host.",
      href: "/deploy",
      icon: "cloud-upload",
    },
  ],
} as const;
