import type { Node, Parent } from "unist";
import { visit } from "unist-util-visit";

interface Element extends Node {
    type: string;
    tagName?: string;
    properties?: Record<string, unknown> & {
        className?: string[];
        raw?: string;
    };
    codeTitle?: string;
    children?: Node[];
    raw?: string;
}

interface TextNode extends Node {
    type: "text";
    value: string;
}

export const handleCodeTitles = () => (tree: Node) => {
    visit(tree, "element", (node: Element, index: number | null, parent: Parent | null) => {
        if (!parent || index === null || node.tagName !== "div") {
            return;
        }

        const isTitleDiv = node.properties?.className?.includes("rehype-code-title");
        if (!isTitleDiv) {
            return;
        }

        let nextElement: Element | null = null;
        for (let i = index + 1; i < parent.children.length; i++) {
            const sibling = parent.children[i];
            if (sibling.type === "element") {
                nextElement = sibling as Element;
                break;
            }
        }

        if (nextElement?.tagName === "pre") {
            const titleNode = node.children?.[0] as TextNode;
            if (titleNode?.type === "text") {
                if (!nextElement.properties) {
                    nextElement.properties = {};
                }
                nextElement.properties["data-title"] = titleNode.value;
                nextElement.codeTitle = titleNode.value;
                parent.children.splice(index, 1);
                return index;
            }
        }
    });
};
