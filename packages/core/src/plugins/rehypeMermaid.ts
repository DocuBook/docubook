import type { Node, Parent } from "unist";
import { visit } from "unist-util-visit";
import type { ElementNode } from "../utils";

interface TextNode extends Node {
  type: "text";
  value: string;
}

/**
 * Rehype plugin that transforms `<pre><code class="language-mermaid">` fenced
 * blocks into `<Mermaid chart="...">` elements.
 *
 * This allows Mermaid diagram definitions to be authored via standard fenced
 * code blocks (````mermaid) which avoids JSX parsing collisions with
 * Mermaid's `{...}` (decision nodes) and `[...]` (label nodes) syntax.
 */
export const rehypeMermaid = () => (tree: Node) => {
  visit(tree, "element", (node: ElementNode, index: number | null, parent: Parent | null) => {
    if (!parent || index === null || node.tagName !== "pre") return;

    const codeEl = node.children?.find(
      (child) =>
        (child as ElementNode).type === "element" && (child as ElementNode).tagName === "code"
    ) as ElementNode | undefined;

    if (!codeEl) return;

    const classList = Array.isArray(codeEl.properties?.className)
      ? (codeEl.properties.className as string[])
      : typeof codeEl.properties?.className === "string"
        ? (codeEl.properties.className as string).split(" ").filter(Boolean)
        : [];

    if (!classList.includes("language-mermaid")) return;

    const textNode = codeEl.children?.find((child) => (child as TextNode).type === "text") as
      | TextNode
      | undefined;

    const chart = textNode?.value ?? "";

    parent.children[index] = {
      type: "element",
      tagName: "Mermaid",
      properties: { chart },
      children: [],
    } as unknown as ElementNode;
  });
};
