export const site = {
  name: "DocuBook",
  description:
    "A markdown-first documentation framework. Write with directives, compile to flat static HTML. No runtime, no server, no lock-in.",
  github: "https://github.com/DocuBook/docubook",
  npm: "https://www.npmjs.com/package/@docubook/flame",
  docs: "/docs/",
  nav: [
    { label: "Documentation", href: "/docs/", external: true },
    { label: "Features", href: "/features" },
    { label: "Plugins", href: "/plugins" },
  ],
} as const;
