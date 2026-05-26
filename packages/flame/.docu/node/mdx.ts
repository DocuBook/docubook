import React from "react";
import {
  serialize,
  extractTocsFromRawMdx,
  extractFrontmatterWithContent,
  createDefaultRehypePlugins,
  createDefaultRemarkPlugins,
  MDXRemote,
} from "@docubook/core";
import { createMdxComponents } from "@docubook/mdx-content";
import { getGitLastModified } from "./utils";

export interface MdxResult {
  content: React.ReactElement;
  compiledSource: string;
  frontmatter: { title?: string; description?: string; date?: string };
  tocs: ReturnType<typeof extractTocsFromRawMdx>;
}

export async function compileMdx(rawMdx: string, filePath: string): Promise<MdxResult> {
  const tocs = extractTocsFromRawMdx(rawMdx);
  const { frontmatter, strippedContent } = extractFrontmatterWithContent<{
    title?: string;
    description?: string;
    date?: string;
  }>(rawMdx);

  const serialized = await serialize(strippedContent, {
    mdxOptions: {
      rehypePlugins: createDefaultRehypePlugins(),
      remarkPlugins: createDefaultRemarkPlugins(),
    },
  });

  const components = createMdxComponents();
  const content = React.createElement(MDXRemote, {
    compiledSource: serialized.compiledSource,
    scope: {},
    frontmatter: {},
    components,
  });

  const date = frontmatter.date || (await getGitLastModified(filePath)) || undefined;

  return {
    content,
    compiledSource: serialized.compiledSource,
    frontmatter: { ...frontmatter, date },
    tocs,
  };
}
