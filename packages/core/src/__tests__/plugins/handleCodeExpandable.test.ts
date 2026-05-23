import { describe, it, expect } from "vitest";
import type { Node } from "unist";
import {
  handleCodeExpandableRemark,
  handleCodeExpandable,
} from "../../plugins/handleCodeExpandable";
import type { ElementNode } from "../../utils";

// --- Remark plugin tests ---

interface CodeNode extends Node {
  type: "code";
  lang?: string;
  meta?: string;
  value: string;
  data?: { hProperties?: Record<string, unknown> };
}

function codeNode(overrides: Partial<CodeNode> = {}): CodeNode {
  return {
    type: "code",
    value: "line1\nline2\nline3",
    ...overrides,
  } as CodeNode;
}

function remarkTree(nodes: Node[]) {
  return { type: "root", children: nodes } as unknown as Node;
}

describe("handleCodeExpandableRemark", () => {
  it("sets data-expandable and line count when meta includes Expandable", () => {
    const node = codeNode({ meta: "Expandable", lang: "ts" });
    handleCodeExpandableRemark()(remarkTree([node]));
    expect(node.data?.hProperties?.["data-expandable"]).toBe("true");
    expect(node.data?.hProperties?.["data-expandable-lines"]).toBe("3");
  });

  it("appends dbLang and dbTitle from lang:title format", () => {
    const node = codeNode({ meta: "Expandable", lang: "typescript:app.ts" });
    handleCodeExpandableRemark()(remarkTree([node]));
    expect(node.data?.hProperties?.["data-language"]).toBe("typescript");
    expect(node.data?.hProperties?.["data-title"]).toBe("app.ts");
    expect(node.meta).toContain("dbLang(typescript)");
    expect(node.meta).toContain("dbTitle(app.ts)");
  });

  it("does not duplicate dbLang/dbTitle if already present", () => {
    const node = codeNode({
      meta: "Expandable dbLang(ts) dbTitle(x.ts)",
      lang: "ts:x.ts",
    });
    handleCodeExpandableRemark()(remarkTree([node]));
    const matches = node.meta!.match(/dbLang/g);
    expect(matches?.length).toBe(1);
  });

  it("skips nodes without Expandable in meta", () => {
    const node = codeNode({ meta: "highlight", lang: "js" });
    handleCodeExpandableRemark()(remarkTree([node]));
    expect(node.data).toBeUndefined();
  });

  it("skips nodes without meta", () => {
    const node = codeNode({ lang: "js" });
    handleCodeExpandableRemark()(remarkTree([node]));
    expect(node.data).toBeUndefined();
  });

  it("adds mdx-expandable-meta class", () => {
    const node = codeNode({ meta: "Expandable", lang: "py" });
    handleCodeExpandableRemark()(remarkTree([node]));
    const classes = node.data?.hProperties?.className as string[];
    expect(classes).toContain("mdx-expandable-meta");
  });

  it("counts lines correctly with leading/trailing newlines", () => {
    const node = codeNode({ meta: "Expandable", lang: "ts", value: "\na\nb\n" });
    handleCodeExpandableRemark()(remarkTree([node]));
    expect(node.data?.hProperties?.["data-expandable-lines"]).toBe("2");
  });

  it("handles empty code value", () => {
    const node = codeNode({ meta: "Expandable", lang: "ts", value: "" });
    handleCodeExpandableRemark()(remarkTree([node]));
    expect(node.data?.hProperties?.["data-expandable-lines"]).toBe("0");
  });
});

// --- Rehype plugin tests ---

function preNode(codeProps: Record<string, unknown> = {}, preProps: Record<string, unknown> = {}): ElementNode {
  return {
    type: "element",
    tagName: "pre",
    properties: { ...preProps },
    children: [
      {
        type: "element",
        tagName: "code",
        properties: {
          className: ["language-ts", "mdx-expandable-meta"],
          "data-expandable": "true",
          "data-expandable-lines": "5",
          ...codeProps,
        },
        children: [{ type: "text", value: "code" }],
      },
    ],
  } as unknown as ElementNode;
}

function rehypeTree(nodes: Node[]) {
  return { type: "root", children: nodes } as unknown as Node;
}

describe("handleCodeExpandable (rehype)", () => {
  it("copies expandable metadata from code to pre", () => {
    const pre = preNode();
    handleCodeExpandable()(rehypeTree([pre]));
    expect(pre.properties?.["data-expandable"]).toBe("true");
    expect(pre.properties?.["data-expandable-lines"]).toBe("5");
  });

  it("adds mdx-expandable-code class to pre", () => {
    const pre = preNode();
    handleCodeExpandable()(rehypeTree([pre]));
    const classes = pre.properties?.className as string[];
    expect(classes).toContain("mdx-expandable-code");
  });

  it("removes mdx-expandable-meta class from code element", () => {
    const pre = preNode();
    handleCodeExpandable()(rehypeTree([pre]));
    const code = pre.children![0] as ElementNode;
    const classes = code.properties?.className as string[];
    expect(classes).not.toContain("mdx-expandable-meta");
  });

  it("resolves language from code data-language property", () => {
    const pre = preNode({ "data-language": "python" });
    handleCodeExpandable()(rehypeTree([pre]));
    expect(pre.properties?.["data-language"]).toBe("python");
  });

  it("resolves language from code className language- prefix", () => {
    const pre = preNode({ "data-language": undefined });
    handleCodeExpandable()(rehypeTree([pre]));
    expect(pre.properties?.["data-language"]).toBe("ts");
  });

  it("resolves title from code data-title property", () => {
    const pre = preNode({ "data-title": "myfile.ts" });
    handleCodeExpandable()(rehypeTree([pre]));
    expect(pre.properties?.["data-title"]).toBe("myfile.ts");
  });

  it("resolves language from dbLang in code data.meta", () => {
    const pre: ElementNode = {
      type: "element",
      tagName: "pre",
      properties: {},
      children: [
        {
          type: "element",
          tagName: "code",
          properties: {
            className: ["mdx-expandable-meta"],
            "data-expandable": "true",
            "data-expandable-lines": "3",
          },
          data: { meta: "Expandable dbLang(rust) dbTitle(main.rs)" },
          children: [],
        },
      ],
    } as unknown as ElementNode;
    handleCodeExpandable()(rehypeTree([pre]));
    expect(pre.properties?.["data-language"]).toBe("rust");
    expect(pre.properties?.["data-title"]).toBe("main.rs");
  });

  it("skips non-pre elements", () => {
    const div: ElementNode = {
      type: "element",
      tagName: "div",
      properties: {},
      children: [],
    } as unknown as ElementNode;
    handleCodeExpandable()(rehypeTree([div]));
    expect(div.properties?.["data-expandable"]).toBeUndefined();
  });

  it("skips pre without expandable code child", () => {
    const pre: ElementNode = {
      type: "element",
      tagName: "pre",
      properties: {},
      children: [
        {
          type: "element",
          tagName: "code",
          properties: { className: ["language-js"] },
          children: [],
        },
      ],
    } as unknown as ElementNode;
    handleCodeExpandable()(rehypeTree([pre]));
    expect(pre.properties?.["data-expandable"]).toBeUndefined();
  });

  it("handles pre with no children gracefully", () => {
    const pre: ElementNode = {
      type: "element",
      tagName: "pre",
      properties: {},
      children: [],
    } as unknown as ElementNode;
    handleCodeExpandable()(rehypeTree([pre]));
    expect(pre.properties?.["data-expandable"]).toBeUndefined();
  });

  it("handles className as string on pre", () => {
    const pre = preNode({}, { className: "existing-class" });
    handleCodeExpandable()(rehypeTree([pre]));
    const classes = pre.properties?.className;
    expect(classes).toContain("mdx-expandable-code");
    expect(classes).toContain("existing-class");
  });
});
