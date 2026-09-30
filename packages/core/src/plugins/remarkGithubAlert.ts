import type { Node } from "unist";
import { visit } from "unist-util-visit";

/**
 * Remark plugin: GitHub alert blockquotes → DocuBook callout components.
 *
 * Contract (docubook):
 * - `> [!NOTE]` … `> [!CAUTION]` are turned into the callout registry
 *   components (`Info`, `Tip`, `Warning`, `Danger`), so docs authored with
 *   GFM alerts render with the same styling as `:::tip` and friends.
 * - The marker is dropped from the body. The GitHub label becomes the
 *   callout title ("Note", "Tip", …) because it does not always match the
 *   DocuBook variant name (`NOTE` → `Info`, `CAUTION` → `Danger`).
 * - `IMPORTANT` keeps GitHub's purple accent and icon: it maps to
 *   `GfmImportant`, a callout variant that exists only for GFM alerts and is
 *   deliberately not exposed as a `:::important` directive.
 * - The marker must be the first line of the blockquote (GitHub rule). Any
 *   other blockquote — including one whose marker sits on a later line — is
 *   left untouched, so plain quotes keep rendering as quotes.
 */

type AlertType = "NOTE" | "TIP" | "IMPORTANT" | "WARNING" | "CAUTION";

/** GitHub label → DocuBook callout component. */
const ALERT_MAP: Record<AlertType, { component: string; label: string }> = {
  NOTE: { component: "Info", label: "Note" },
  TIP: { component: "Tip", label: "Tip" },
  IMPORTANT: { component: "GfmImportant", label: "Important" },
  WARNING: { component: "Warning", label: "Warning" },
  CAUTION: { component: "Danger", label: "Caution" },
};

/** Marker plus the line break it owns, so the body starts at the next line. */
const ALERT_MARKER = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*(?:\n|$)/i;

type ParentNode = Node & { children: Node[] };

type TextNode = Node & { type: "text"; value: string };

export function remarkGithubAlert() {
  return (tree: Node) => {
    visit(tree, "blockquote", (node: Node, index: number | undefined, parent: Node | undefined) => {
      if (index === undefined || parent === undefined) return;
      const replacement = blockquoteToCallout(node as ParentNode);
      if (!replacement) return;
      (parent as ParentNode).children[index] = replacement;
    });
    return tree;
  };
}

function blockquoteToCallout(blockquote: ParentNode): Node | null {
  const [first] = blockquote.children;
  if (first?.type !== "paragraph") return null;
  const paragraph = first as ParentNode;
  const [leading] = paragraph.children;
  const text = leading as TextNode | undefined;
  if (text?.type !== "text") return null;

  const match = ALERT_MARKER.exec(text.value);
  if (!match) return null;
  const alert = ALERT_MAP[match[1].toUpperCase() as AlertType];

  // Drop the marker line and keep the rest of the paragraph intact: the
  // remainder of the text node (bold/link siblings stay untouched), then the
  // paragraph itself when the marker was its only content.
  text.value = text.value.slice(match[0].length);
  if (text.value === "") paragraph.children.shift();
  if (paragraph.children.length === 0) blockquote.children.shift();

  return {
    type: "mdxJsxFlowElement",
    name: alert.component,
    attributes: [{ type: "mdxJsxAttribute", name: "title", value: alert.label }],
    children: blockquote.children,
    position: blockquote.position,
  } as Node;
}
