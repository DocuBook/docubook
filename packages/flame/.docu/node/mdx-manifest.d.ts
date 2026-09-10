// Virtual module served by the `mdx-hydrate` esbuild plugin (hydrate.node.ts).
// Maps doc slug → lazy compiled MDX module. Generated at bundle time; never on disk.
import type { ComponentType } from "react";
export declare const mdxModules: Record<string, () => Promise<{ default: ComponentType }>>;
