import type { Node, Parent } from "unist";
import { visit } from "unist-util-visit";
import type { ElementNode } from "../utils";

interface TextNode extends Node {
  type: "text";
  value: string;
}

const LANGUAGE = "filetree";

/**
 * Rehype plugin that transforms ```filetree fenced blocks into `<Tree content="…">` elements, the
 * interactive file tree from @docubook/markdown.
 *
 * The fence body is an indented list: one entry per line, children indented under their parent, no
 * connector characters. A fence keeps every leading space, which is what makes indentation alone
 * enough; the legacy `::::tree` directive's body goes through the markdown parser and loses it.
 *
 * The tree's accessible label (not drawn) comes from `title="…"` in the fence meta, read by
 * `preProcess` into `codeTitle`, or from the `filetree:title` shorthand: the same two forms code
 * blocks accept. Runs after `preProcess` and before the code-title and Prism plugins, which would
 * otherwise claim the fence.
 */
export const rehypeFileTree = () => (tree: Node) => {
  visit(tree, "element", (node: ElementNode, index: number | null, parent: Parent | null) => {
    if (!parent || index === null || node.tagName !== "pre") return;

    const codeEl = node.children?.find(
      (child) =>
        (child as ElementNode).type === "element" && (child as ElementNode).tagName === "code"
    ) as ElementNode | undefined;
    if (!codeEl) return;

    const className = codeEl.properties?.className;
    const classList = Array.isArray(className)
      ? (className as string[])
      : typeof className === "string"
        ? className.split(" ").filter(Boolean)
        : [];
    const languageClass = classList.find(
      (item) => item === `language-${LANGUAGE}` || item.startsWith(`language-${LANGUAGE}:`)
    );
    if (!languageClass) return;

    const content = (codeEl.children ?? [])
      .map((child) => ((child as TextNode).type === "text" ? (child as TextNode).value : ""))
      .join("");
    const shorthandTitle = languageClass.slice(`language-${LANGUAGE}`.length + 1);
    const title = shorthandTitle || node.codeTitle;

    parent.children[index] = {
      type: "element",
      tagName: "Tree",
      properties: { content, ...(title ? { title } : {}) },
      children: [],
    } as unknown as ElementNode;
  });
};
