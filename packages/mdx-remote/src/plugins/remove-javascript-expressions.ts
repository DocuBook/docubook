import { visit, SKIP } from "unist-util-visit";
import type { Node } from "unist";

/**
 * remark plugin: removes JS expression nodes ({variable}, {func()}) from MDX.
 * Preserves JSX (<Component />) and plain markdown.
 */
export const removeJavaScriptExpressions = () => {
  return (tree: Node) => {
    visit(tree, (node: Node, index: number | undefined, parent: Node | undefined) => {
      if (
        node.type === "mdxFlowExpression" ||
        node.type === "mdxTextExpression"
      ) {
        if (parent && typeof index === "number") {
          (parent as any).children.splice(index, 1);
          return [SKIP, index] as const;
        }
      }

      if (
        node.type === "mdxJsxFlowElement" ||
        node.type === "mdxJsxTextElement"
      ) {
        const el = node as any;
        if (el.attributes) {
          el.attributes = el.attributes.filter((attr: any) => {
            if (attr.type === "mdxJsxAttribute") {
              return (
                attr.value === null ||
                typeof attr.value === "string" ||
                (attr.value && attr.value.type !== "mdxJsxAttributeValueExpression")
              );
            }
            return attr.type !== "mdxJsxExpressionAttribute";
          });
        }
      }
    });
  };
};
