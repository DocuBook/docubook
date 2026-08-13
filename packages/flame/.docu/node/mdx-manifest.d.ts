// Virtual module served by the `mdx-hydrate` esbuild plugin (hydrate.node.ts).
// Maps doc slug → compiled MDX module. Generated at bundle time; never on disk.
declare module "./mdx-manifest" {
  export const mdxModules: Record<string, { default: React.ComponentType }>;
}
