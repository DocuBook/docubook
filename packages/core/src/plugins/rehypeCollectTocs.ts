import type { Node } from "unist";
import { visit } from "unist-util-visit";
import type { TocItem } from "../types";
import type { ElementNode } from "../utils";

function headingText(node: Node): string {
  const element = node as ElementNode;
  if (element.properties?.ariaHidden === true || element.properties?.ariaHidden === "true") {
    return "";
  }
  if (node.type === "text") return (node as Node & { value: string }).value;
  return element.children?.map(headingText).join("") ?? "";
}

/** Collect final heading IDs, after slugging and user rehype transforms. */
export function rehypeCollectTocs(tocs: TocItem[]) {
  return (tree: Node) => {
    tocs.length = 0;
    visit(tree, "element", (node: ElementNode) => {
      if (!/^h[2-4]$/.test(node.tagName ?? "") || typeof node.properties?.id !== "string") return;
      tocs.push({
        level: Number(node.tagName!.slice(1)),
        text: headingText(node),
        href: `#${node.properties.id}`,
      });
    });
  };
}
