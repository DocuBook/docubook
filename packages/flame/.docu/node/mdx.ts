import React from "react";
import type { Pluggable } from "unified";
import {
  serialize,
  extractTocsFromRawMdx,
  extractFrontmatterWithContent,
  createDefaultRehypePlugins,
  createDefaultRemarkPlugins,
  MDXRemote,
} from "@docubook/core";
import { createMdxComponents } from "@docubook/mdx-content";
import { getGitLastModified, getGitLastModifiedBatch } from "./utils";

export { getGitLastModifiedBatch };

export interface MdxResult {
  content: React.ReactElement;
  compiledSource: string;
  frontmatter: { title?: string; description?: string; date?: string };
  tocs: ReturnType<typeof extractTocsFromRawMdx>;
}

/**
 * Compile MDX/MD content into a React element and compiled source.
 *
 * @param rawMdx - Raw MDX/MD file content
 * @param filePath - Relative file path for git date lookup
 * @param gitDates - Optional pre-fetched git last-modified map
 * @param remarkPlugins - Additional remark plugins (merged after defaults, optional)
 * @param rehypePlugins - Additional rehype plugins (merged after defaults, optional)
 */
export async function compileMdx(
  rawMdx: string,
  filePath: string,
  gitDates?: Map<string, string>,
  remarkPlugins?: Pluggable[],
  rehypePlugins?: Pluggable[]
): Promise<MdxResult> {
  const tocs = extractTocsFromRawMdx(rawMdx);
  const { frontmatter, strippedContent } = extractFrontmatterWithContent<{
    title?: string;
    description?: string;
    date?: string;
  }>(rawMdx);

  const defaultRemark = createDefaultRemarkPlugins();
  const defaultRehype = createDefaultRehypePlugins();

  const finalRemark = remarkPlugins?.length ? [...defaultRemark, ...remarkPlugins] : defaultRemark;
  const finalRehype = rehypePlugins?.length ? [...defaultRehype, ...rehypePlugins] : defaultRehype;

  const serialized = await serialize(strippedContent, {
    mdxOptions: {
      rehypePlugins: finalRehype,
      remarkPlugins: finalRemark,
    },
  });

  const components = createMdxComponents();
  const content = React.createElement(MDXRemote, {
    compiledSource: serialized.compiledSource,
    scope: {},
    frontmatter: {},
    components,
  });

  const date =
    frontmatter.date ||
    gitDates?.get(filePath) ||
    (await getGitLastModified(filePath)) ||
    undefined;

  return {
    content,
    compiledSource: serialized.compiledSource,
    frontmatter: { ...frontmatter, date },
    tocs,
  };
}
