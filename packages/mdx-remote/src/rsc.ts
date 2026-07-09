import React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import * as jsxDevRuntime from "react/jsx-dev-runtime";
import { serialize } from "./serialize.js";
import type { CompileMDXOptions, CompileMDXResult } from "./types.js";

/**
 * Compile MDX source and render into a React element (RSC / App Router).
 *
 * The compiled MDX function-body expects `opts` to contain the full
 * JSX runtime (`jsx`, `jsxs`, `Fragment`) — not just `React.createElement`.
 */
export async function compileMDX<Frontmatter = Record<string, unknown>>({
  source,
  options,
  components = {},
}: CompileMDXOptions<Frontmatter>): Promise<CompileMDXResult<Frontmatter>> {
  const { compiledSource, frontmatter, scope } = await serialize(
    source,
    { ...(options ?? {}), parseFrontmatter: options?.parseFrontmatter ?? false },
    true, // rsc mode
  );

  // jsx/jsxs (production) and jsxDEV (development) are in separate React 19
  // modules. Merge both so the scope works regardless of compile mode.
  const fullScope = {
    opts: { ...jsxRuntime, ...jsxDevRuntime },
    frontmatter,
    ...scope,
  };

  const keys = Object.keys(fullScope);
  const values = Object.values(fullScope);

  const hydrateFn = Reflect.construct(Function, keys.concat(`${compiledSource}`));
  const Content = (hydrateFn.apply(hydrateFn, values) as any).default;

  return {
    content: React.createElement(Content, { components }),
    frontmatter: frontmatter as Frontmatter,
  };
}

/**
 * Server Component that compiles & renders MDX inline.
 */
export async function MDXRemote<Frontmatter = Record<string, unknown>>(
  props: CompileMDXOptions<Frontmatter>,
): Promise<React.ReactElement> {
  const { content } = await compileMDX(props);
  return content;
}
