import { serialize } from "./mdx-compiler/serialize.js";
import type { Node } from "unist";
import { visit } from "unist-util-visit";
import remarkGfm from "remark-gfm";
import rehypePrism from "rehype-prism-plus";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import rehypeCodeTitles from "rehype-code-titles";
import { handleCodeTitles } from "./plugins/handleCodeTitles";
import { handleCodeExpandableRemark, handleCodeExpandable } from "./plugins/handleCodeExpandable";
import { rehypeMermaid } from "./plugins/rehypeMermaid";
import { remarkDirectiveToMdx } from "./plugins/remarkDirectiveToMdx";
import { remarkGithubAlert } from "./plugins/remarkGithubAlert";
import remarkDirective from "remark-directive";
import type { ElementNode } from "./utils";
import type { Pluggable } from "unified";

// Re-export serialize for non-RSC usage
export { serialize };

// Re-export MDXRemote for client-side hydration
export { MDXRemote } from "./mdx-compiler/index.js";

interface TextNode extends Node {
  type: "text";
  value: string;
}

/**
 * Extract a fallback title from fence meta, e.g. ```python title="main.py"
 * Only reads the attribute; the meta string is left untouched so other
 * options (showLineNumbers, {1,3}, Expandable, ...) keep their order.
 */
function extractMetaTitle(meta: unknown): string | undefined {
  if (typeof meta !== "string") return undefined;
  // Guard: only accept a well-formed quoted value. Malformed input (unclosed
  // quote, empty value) is ignored so a fence typo never breaks compilation.
  const match = meta.match(/(?:^|[\s{])title\s*=\s*(?:"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)')/);
  const raw = match?.[1] ?? match?.[2];
  if (!raw) return undefined;
  return raw.replace(/\\(["'\\])/g, "$1") || undefined;
}

export const preProcess = () => (tree: Node) => {
  visit(tree, (node: Node) => {
    const element = node as ElementNode;
    if (element?.type === "element" && element?.tagName === "pre" && element.children) {
      const [codeEl] = element.children as ElementNode[];
      if (!codeEl || codeEl.tagName !== "code" || !codeEl.children?.[0]) return;

      const className = codeEl.properties?.className;
      const classList = Array.isArray(className)
        ? className
        : typeof className === "string"
          ? className.split(" ").filter(Boolean)
          : [];
      const languageClass = classList.find((item: string) => item.startsWith("language-"));
      if (languageClass) {
        element.language = languageClass.replace("language-", "").split(":")[0];
      }

      const firstChild = codeEl.children[0];
      const textNode = firstChild?.type === "text" ? (firstChild as TextNode) : undefined;
      if (textNode?.value) {
        element.raw = textNode.value;
      }

      // Fallback title syntax: ```python title="main.py". The `lang:title`
      // syntax stays primary; postProcess never overwrites an existing data-title.
      const metaTitle = extractMetaTitle(codeEl.data?.["meta"]);
      if (metaTitle) {
        element.codeTitle = metaTitle;
      }
    }
  });

  return tree;
};

export const postProcess = () => (tree: Node) => {
  visit(tree, "element", (node: Node) => {
    const element = node as ElementNode;
    if (element?.type === "element" && element?.tagName === "pre") {
      if (element.properties && element.raw) {
        element.properties.raw = element.raw;
      }
      if (element.properties && element.language && !element.properties["data-language"]) {
        element.properties["data-language"] = element.language;
      }
      if (element.properties && element.codeTitle && !element.properties["data-title"]) {
        element.properties["data-title"] = element.codeTitle;
      }
    }
  });

  return tree;
};

export function createDefaultRehypePlugins(): Pluggable[] {
  return [
    preProcess,
    rehypeMermaid, // Transform ```mermaid before code transforms
    rehypeCodeTitles,
    handleCodeTitles,
    handleCodeExpandable, // Copy expandable metadata from <code> to <pre> before prism transforms nodes.
    // ignoreMissing: a fence language refractor does not know (e.g. `env`, `mdx`)
    // must render as plain code, not abort the whole build.
    [rehypePrism, { ignoreMissing: true }],
    handleCodeExpandable, // Re-apply expandable attrs after prism tokenization.
    rehypeSlug,
    rehypeAutolinkHeadings,
    postProcess,
  ];
}

export function createDefaultRemarkPlugins(): Pluggable[] {
  return [
    remarkGfm,
    remarkGithubAlert,
    handleCodeExpandableRemark,
    remarkDirective,
    remarkDirectiveToMdx,
  ];
}
