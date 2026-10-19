// MPL-2.0 — derived from next-mdx-remote (IBM). See LICENSE-MPL-2.0.
import { visit, SKIP } from "unist-util-visit";
import type { Node, Parent } from "unist";

interface MdxJsxAttribute {
  type: string;
  name?: string;
  value?: unknown;
}

interface MdxJsxElement extends Node {
  attributes?: MdxJsxAttribute[];
}

/**
 * remark plugin: removes JS expression nodes ({variable}, {func()}) from MDX.
 * Preserves JSX (<Component />) and plain markdown.
 */
export const removeJavaScriptExpressions = () => {
  return (tree: Node) => {
    visit(tree, (node: Node, index: number | undefined, parent: Node | undefined) => {
      if (node.type === "mdxFlowExpression" || node.type === "mdxTextExpression") {
        if (parent && typeof index === "number" && "children" in parent) {
          (parent as Parent).children.splice(index, 1);
          return [SKIP, index] as const;
        }
      }

      if (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") {
        const el = node as MdxJsxElement;
        if (el.attributes) {
          el.attributes = el.attributes.filter((attr) => {
            if (attr.type === "mdxJsxAttribute") {
              const val = attr.value as { type?: string } | null | string | undefined;
              return (
                val === null ||
                typeof val === "string" ||
                (typeof val === "object" && val.type !== "mdxJsxAttributeValueExpression")
              );
            }
            return attr.type !== "mdxJsxExpressionAttribute";
          });
        }
      }
    });
  };
};
