import { compile } from "@mdx-js/mdx";
import { VFile } from "vfile";
import { matter } from "vfile-matter";
import { createFormattedMDXError } from "./format-mdx-error.js";
import { removeImportsExportsPlugin } from "./plugins/remove-imports-exports.js";
import { removeJavaScriptExpressions } from "./plugins/remove-javascript-expressions.js";
import { CreateRemoveDangerousCallsPlugin } from "./plugins/remove-dangerous-javascript-expressions.js";
import type { Pluggable } from "unified";

/** @internal — re-exported from unified. */
type RemarkPlugins = Pluggable[];
type RehypePlugins = Pluggable[];

export type { MDXRemoteSerializeResult } from "./types";

export type SerializeOptions = {
  scope?: Record<string, unknown>;
  mdxOptions?: {
    remarkPlugins?: RemarkPlugins;
    rehypePlugins?: RehypePlugins;
    useDynamicImport?: boolean;
  };
  parseFrontmatter?: boolean;
  /** @default true */
  blockJS?: boolean;
  /** @default true */
  blockDangerousJS?: boolean;
};

export type SerializeResult = {
  compiledSource: string;
  frontmatter: Record<string, unknown>;
  scope: Record<string, unknown>;
};

function getCompileOptions(
  mdxOptions: SerializeOptions["mdxOptions"] = {},
  rsc = false,
  blockJS = true,
  blockDangerousJS = true,
) {
  const areImportsEnabled = mdxOptions?.useDynamicImport ?? false;
  const remarkPlugins = [
    ...(mdxOptions?.remarkPlugins ?? []),
    ...(areImportsEnabled ? [] : [removeImportsExportsPlugin]),
    ...(blockJS ? [removeJavaScriptExpressions] : []),
    ...(!blockJS && blockDangerousJS ? [CreateRemoveDangerousCallsPlugin()] : []),
  ];

  return {
    ...mdxOptions,
    remarkPlugins,
    rehypePlugins: mdxOptions?.rehypePlugins ?? [],
    outputFormat: "function-body" as const,
    providerImportSource: rsc ? undefined : "@mdx-js/react",
    development: process.env.NODE_ENV !== "production",
  };
}

/**
 * Compile raw MDX string into a serialized result that can be rendered.
 */
export async function serialize(
  source: string,
  {
    scope = {},
    mdxOptions = {},
    parseFrontmatter = false,
    blockJS = true,
    blockDangerousJS = true,
  }: SerializeOptions = {},
  rsc = false,
): Promise<SerializeResult> {
  const vfile = new VFile(source);

  if (parseFrontmatter) {
    matter(vfile, { strip: true });
  }

  let compiledSource: string;
  try {
    compiledSource = String(
      await compile(vfile, getCompileOptions(mdxOptions, rsc, blockJS, blockDangerousJS)),
    );
  } catch (error: any) {
    throw createFormattedMDXError(error, String(vfile));
  }

  return {
    compiledSource,
    frontmatter: (vfile.data.matter ?? {}) as Record<string, unknown>,
    scope,
  };
}
