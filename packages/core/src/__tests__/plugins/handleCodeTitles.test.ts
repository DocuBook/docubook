import { describe, it, expect } from "vitest";
import type { Node, Parent } from "unist";
import { handleCodeTitles } from "../../plugins/handleCodeTitles";
import type { ElementNode } from "../../utils";

function buildTree(children: Node[]): Parent {
  return { type: "root", children } as Parent;
}

function titleDiv(text: string): Node {
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["rehype-code-title"] },
    children: [{ type: "text", value: text }],
  } as unknown as Node;
}

function preElement(props: Record<string, unknown> = {}): Node {
  return {
    type: "element",
    tagName: "pre",
    properties: { ...props },
    children: [
      {
        type: "element",
        tagName: "code",
        properties: { className: ["language-ts"] },
        children: [{ type: "text", value: "const x = 1" }],
      },
    ],
  } as unknown as Node;
}

describe("handleCodeTitles", () => {
  it("transfers title from div to next pre element", () => {
    const pre = preElement();
    const tree = buildTree([titleDiv("example.ts"), pre]);
    handleCodeTitles()(tree);
    const el = pre as ElementNode;
    expect(el.properties?.["data-title"]).toBe("example.ts");
    expect(el.codeTitle).toBe("example.ts");
  });

  it("removes the title div from the tree", () => {
    const tree = buildTree([titleDiv("app.js"), preElement()]);
    handleCodeTitles()(tree);
    expect(tree.children.length).toBe(1);
    expect((tree.children[0] as ElementNode).tagName).toBe("pre");
  });

  it("skips div without rehype-code-title class", () => {
    const div: Node = {
      type: "element",
      tagName: "div",
      properties: { className: ["other"] },
      children: [{ type: "text", value: "not a title" }],
    } as unknown as Node;
    const pre = preElement();
    const tree = buildTree([div, pre]);
    handleCodeTitles()(tree);
    expect(tree.children.length).toBe(2);
    expect((pre as ElementNode).properties?.["data-title"]).toBeUndefined();
  });

  it("skips when next sibling is not a pre element", () => {
    const div: Node = {
      type: "element",
      tagName: "div",
      properties: {},
      children: [],
    } as unknown as Node;
    const tree = buildTree([titleDiv("title.ts"), div]);
    handleCodeTitles()(tree);
    expect(tree.children.length).toBe(2);
  });

  it("skips text nodes between title div and pre", () => {
    const textNode: Node = { type: "text", value: "\n" } as unknown as Node;
    const pre = preElement();
    const tree = buildTree([titleDiv("file.ts"), textNode, pre]);
    handleCodeTitles()(tree);
    const el = pre as ElementNode;
    expect(el.properties?.["data-title"]).toBe("file.ts");
  });

  it("handles title div with non-text child gracefully", () => {
    const badTitleDiv: Node = {
      type: "element",
      tagName: "div",
      properties: { className: ["rehype-code-title"] },
      children: [{ type: "element", tagName: "span", properties: {}, children: [] }],
    } as unknown as Node;
    const tree = buildTree([badTitleDiv, preElement()]);
    handleCodeTitles()(tree);
    // Should not remove the div since child is not text
    expect(tree.children.length).toBe(2);
  });

  it("initializes properties on pre if missing", () => {
    const pre: Node = {
      type: "element",
      tagName: "pre",
      children: [],
    } as unknown as Node;
    const tree = buildTree([titleDiv("test.js"), pre]);
    handleCodeTitles()(tree);
    expect((pre as ElementNode).properties?.["data-title"]).toBe("test.js");
  });
});
