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
import { getGitLastModified, getGitLastModifiedBatch, getFilesystemMtime } from "./git";

/**
 * Return the value with `.html` appended, or null if the value should be left
 * unchanged.  Rules:
 *  - Must be a string
 *  - Must start with /docs/  (the /docs root index needs no suffix)
 *  - Must not be an external URL, contain a fragment, or already end in .html
 */
function appendHtml(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (/^https?:\/\//.test(value)) return null;
  if (!value.startsWith("/docs/")) return null;
  if (value.includes("#")) return null;
  if (value.endsWith(".html")) return null;
  return `${value}.html`;
}

interface HastNode {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

interface MdastNode {
  type: string;
  // MDX JSX nodes carry their props as an attributes array
  attributes?: { type: string; name: string; value: unknown }[];
  children?: MdastNode[];
}

/**
 * Rehype plugin: append `.html` to internal `/docs/` hrefs on HTML `<a>` nodes.
 *
 * This covers standard markdown links: `[text](/docs/page)` → `<a href="…">`.
 * It runs in the HAST (HTML AST) phase, where `<a>` elements are real nodes.
 *
 * Skips: external URLs, anchor-only links, paths that already end in `.html`,
 * and the `/docs` root index (no trailing slash segment).
 */
function rehypeDocsHtmlLinks() {
  return (tree: HastNode) => {
    function walk(node: HastNode): void {
      if (node.type === "element" && node.tagName === "a") {
        const fixed = appendHtml(node.properties?.href);
        if (fixed) node.properties!.href = fixed;
      }
      if (node.children) {
        for (const child of node.children) walk(child);
      }
    }
    walk(tree);
    return tree;
  };
}

/**
 * Remark plugin: append `.html` to internal `/docs/` hrefs on MDX JSX nodes.
 *
 * MDX JSX elements (`<Card href="…">`, `<LinkCard href="…">`, etc.) live in
 * the MDAST as `mdxJsxFlowElement` / `mdxJsxTextElement` nodes.  They are
 * compiled directly to JavaScript by the MDX compiler *before* rehype runs,
 * so a rehype plugin can never see them as `<a>` elements.  This remark plugin
 * intercepts them at the MDAST phase where their `attributes` array is still
 * accessible and mutable.
 *
 * Skips: same rules as `appendHtml` (external URLs, anchors, already `.html`).
 */
function remarkMdxJsxDocsHtmlLinks() {
  return (tree: MdastNode) => {
    function walk(node: MdastNode): void {
      if (
        (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") &&
        node.attributes
      ) {
        for (const attr of node.attributes) {
          if (attr.type === "mdxJsxAttribute" && attr.name === "href") {
            const fixed = appendHtml(attr.value);
            if (fixed) attr.value = fixed;
          }
        }
      }
      if (node.children) {
        for (const child of node.children) walk(child);
      }
    }
    walk(tree);
    return tree;
  };
}

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

  // remarkMdxJsxDocsHtmlLinks must run before user plugins so custom remark
  // transforms see already-fixed hrefs.  rehypeDocsHtmlLinks handles plain
  // markdown [text](path) → <a> elements in the HAST phase.
  const finalRemark = [...defaultRemark, remarkMdxJsxDocsHtmlLinks, ...(remarkPlugins ?? [])];
  const finalRehype = [...defaultRehype, rehypeDocsHtmlLinks, ...(rehypePlugins ?? [])];

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
    (await getFilesystemMtime(filePath)) ||
    undefined;

  return {
    content,
    compiledSource: serialized.compiledSource,
    frontmatter: { ...frontmatter, date },
    tocs,
  };
}
