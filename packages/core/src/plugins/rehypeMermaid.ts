import type { Node, Parent } from "unist";
import { visit } from "unist-util-visit";
import { getFenceCode, type ElementNode } from "../utils";

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
    if (!parent || index === null) return;

    const fence = getFenceCode(node);
    if (!fence || !fence.classList.includes("language-mermaid")) return;
    const codeEl = fence.code;

    const textNode = codeEl.children?.find((child) => (child as TextNode).type === "text") as
      TextNode | undefined;

    const chart = textNode?.value ?? "";

    parent.children[index] = {
      type: "element",
      tagName: "Mermaid",
      properties: { chart },
      children: [],
    } as unknown as ElementNode;
  });
};
