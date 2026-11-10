import { describe, expect, it } from "vitest";
import type { Node, Parent } from "unist";
import { rehypeMermaid } from "../../plugins/rehypeMermaid";
import { classListOf, getFenceCode, type ElementNode } from "../../utils";

const code = (className: unknown, value = "graph TD; A-->B"): ElementNode =>
  ({
    type: "element",
    tagName: "code",
    properties: className === undefined ? {} : { className },
    children: [{ type: "text", value }],
  }) as unknown as ElementNode;

const pre = (...children: ElementNode[]): ElementNode =>
  ({ type: "element", tagName: "pre", properties: {}, children }) as unknown as ElementNode;

describe("classListOf", () => {
  it("reads class names stored as an array or a string", () => {
    expect(classListOf(code(["language-mermaid", "x"]))).toEqual(["language-mermaid", "x"]);
    expect(classListOf(code("language-mermaid  x"))).toEqual(["language-mermaid", "x"]);
  });

  it("returns an empty list without a className or an element", () => {
    expect(classListOf(code(undefined))).toEqual([]);
    expect(classListOf(undefined)).toEqual([]);
  });
});

describe("getFenceCode", () => {
  it("returns the code child of a pre with its class list", () => {
    const el = code("language-filetree");
    expect(getFenceCode(pre(el))).toEqual({ code: el, classList: ["language-filetree"] });
  });

  it("ignores elements that are not a pre, and a pre without a code child", () => {
    expect(getFenceCode(code("language-mermaid"))).toBeUndefined();
    expect(getFenceCode(pre())).toBeUndefined();
  });
});

describe("rehypeMermaid on the shared helper", () => {
  const run = (className: unknown) => {
    const root = { type: "root", children: [pre(code(className))] } as unknown as Parent;
    rehypeMermaid()(root as Node);
    return root.children[0] as ElementNode;
  };

  it("swaps a mermaid fence for a Mermaid element with the chart", () => {
    for (const className of [["language-mermaid"], "language-mermaid"]) {
      const el = run(className);
      expect(el.tagName).toBe("Mermaid");
      expect(el.properties).toEqual({ chart: "graph TD; A-->B" });
    }
  });

  it("leaves other fences alone", () => {
    expect(run(["language-ts"]).tagName).toBe("pre");
  });
});
