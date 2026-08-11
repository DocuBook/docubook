import type { Node } from "unist";

/**
 * Remark plugin: convert markdown directives into MDX component elements.
 *
 * Contract (docubook):
 * - `:::name{attrs} … :::` — container: EVERY component that holds content
 *   (tabs, tab, accordions, accordion, steps, step, cards, card, files,
 *   folder, note + variants). Children are the block between the opening
 *   `:::` and closing `:::` — bounded by micromark's container grammar, so
 *   a component can never trap siblings that follow it.
 * - `::name{attrs}` — self-closing leaf (no children): file, youtube,
 *   mermaid.
 * - `:tooltip[label]{tip="…"}` — the ONE inline (single-colon) directive.
 *   Every other text directive is rebuilt as literal text
 *   (`localhost:3000` stays intact). `::tooltip` (block leaf) is removed
 *   in v2 — tooltips are inline only.
 *
 * Names are PascalCased to match the components map (`file-tree` → `FileTree`).
 * Bare attributes (`{horizontal}`) become boolean props (JSX bare attribute).
 * Callout variants (`:::tip`, `:::info`, …) map to their own registry entries
 * (`Tip`/`Info`/…) which wrap the `Callout` component with the type set.
 */
export function remarkDirectiveToMdx() {
  return (tree: Node) => {
    const root = tree as unknown as { children: Node[] };
    root.children = root.children.map(transform);
    return tree;
  };
}

/** Leaves that never hold children (self-closing). */
const PURE_LEAVES = new Set(["youtube"]);

type DirectiveNode = Node & {
  type: "containerDirective" | "leafDirective" | "textDirective";
  name: string;
  label?: string;
  attributes?: Record<string, string>;
  children?: Node[];
};

function isDirective(node: Node): node is DirectiveNode {
  return (
    node.type === "containerDirective" ||
    node.type === "leafDirective" ||
    node.type === "textDirective"
  );
}

function transform(node: Node): Node {
  if (!isDirective(node)) {
    const children = (node as unknown as { children?: Node[] }).children;
    if (Array.isArray(children)) {
      (node as unknown as { children: Node[] }).children = children.map(transform);
    }
    return node;
  }
  if (node.type === "textDirective") {
    // `:tooltip[label]{tip="…"}` is the one inline component — it stays
    // inside the paragraph. Every other single-colon text directive is
    // rebuilt as literal text (`localhost:3000` stays intact).
    if (node.name === "tooltip") {
      return inlineTooltip(node);
    }
    return literalDirective(node);
  }
  // Block-form tooltips are gone in v2 — degrade to literal text so the
  // author sees the directive instead of a broken component.
  if (node.type === "leafDirective" && node.name === "tooltip") {
    return literalDirective(node);
  }
  // containerDirective → component with children; leafDirective → self-closing.
  const children =
    node.type === "containerDirective" && !PURE_LEAVES.has(node.name)
      ? (node.children ?? []).map(transform)
      : [];
  return directiveToElement(node, children);
}

function directiveToElement(directive: DirectiveNode, children: Node[]): Node {
  const name = pascalCase(directive.name);
  const attributes = Object.entries(directive.attributes ?? {}).map(([attrName, value]) => ({
    type: "mdxJsxAttribute",
    name: attrName,
    value: value === "" ? null : value,
  }));
  return {
    type: "mdxJsxFlowElement",
    name,
    attributes,
    children,
  } as Node;
}

/** Rebuild a text directive as literal text (single-colon is not a contract). */
function literalDirective(directive: DirectiveNode): Node {
  const literal = ":" + directive.name + (directive.label ? `[${directive.label}]` : "");
  const attrStr = Object.entries(directive.attributes ?? {})
    .map(([k, v]) => (v === "" ? k : `${k}="${v}"`))
    .join(" ");
  return { type: "text", value: literal + (attrStr ? `{${attrStr}}` : "") } as Node;
}

/**
 * Inline tooltip from a text directive: `:tooltip[label]{tip="…"}`.
 * The label is the visible trigger (dotted underline); `tip` is the hover
 * bubble and defaults to the label, so `:tooltip[text]` alone already shows
 * a bubble. Emits an inline element so it stays inside the paragraph. The
 * bubble auto-positions (no `side` prop).
 */
function inlineTooltip(directive: DirectiveNode): Node {
  const label = (directive.children ?? [])
    .map((child) => (child as { value?: string }).value ?? "")
    .join("");
  const attrs = directive.attributes ?? {};
  const attributes = [
    { type: "mdxJsxAttribute", name: "text", value: attrs.text || label || "?" },
    { type: "mdxJsxAttribute", name: "tip", value: attrs.tip || label || "" },
  ];
  return { type: "mdxJsxTextElement", name: "Tooltip", attributes, children: [] } as Node;
}

function pascalCase(name: string): string {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}
