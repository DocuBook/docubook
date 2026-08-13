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

export const preProcess = () => (tree: Node) => {
  visit(tree, (node: Node) => {
    const element = node as ElementNode;
    if (element?.type === "element" && element?.tagName === "pre" && element.children) {
      const [codeEl] = element.children as ElementNode[];
      if (codeEl.tagName !== "code" || !codeEl.children?.[0]) return;

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

      const textNode = codeEl.children[0] as TextNode;
      if (textNode.type === "text" && textNode.value) {
        element.raw = textNode.value;
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
    rehypePrism,
    handleCodeExpandable, // Re-apply expandable attrs after prism tokenization.
    rehypeSlug,
    rehypeAutolinkHeadings,
    postProcess,
  ];
}

export function createDefaultRemarkPlugins(): Pluggable[] {
  return [remarkGfm, handleCodeExpandableRemark, remarkDirective, remarkDirectiveToMdx];
}
