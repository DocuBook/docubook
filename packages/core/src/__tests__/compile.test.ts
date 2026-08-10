import { describe, it, expect } from "vitest";
import type { Node } from "unist";
import {
  preProcess,
  postProcess,
  createDefaultRehypePlugins,
  createDefaultRemarkPlugins,
} from "../compile";
import type { ElementNode } from "../utils";

function buildPreTree(lang: string, code: string): Node {
  return {
    type: "element",
    tagName: "pre",
    properties: {},
    children: [
      {
        type: "element",
        tagName: "code",
        properties: { className: [`language-${lang}`] },
        children: [{ type: "text", value: code }],
      },
    ],
  } as unknown as Node;
}

describe("preProcess", () => {
  it("extracts raw code and language from pre>code", () => {
    const tree = buildPreTree("typescript", "const x = 1");
    preProcess()(tree);
    const el = tree as ElementNode;
    expect(el.raw).toBe("const x = 1");
    expect(el.language).toBe("typescript");
  });

  it("handles language with colon suffix (title)", () => {
    const tree = buildPreTree("js:app.js", "console.log('hi')");
    preProcess()(tree);
    const el = tree as ElementNode;
    expect(el.language).toBe("js");
  });

  it("skips non-pre elements", () => {
    const tree: Node = {
      type: "element",
      tagName: "div",
      properties: {},
      children: [],
    } as unknown as Node;
    preProcess()(tree);
    expect((tree as ElementNode).raw).toBeUndefined();
  });
});

describe("postProcess", () => {
  it("copies raw and language to properties", () => {
    const tree: Node = {
      type: "element",
      tagName: "pre",
      properties: {},
      raw: "const x = 1",
      language: "ts",
      codeTitle: "example.ts",
      children: [],
    } as unknown as Node;
    postProcess()(tree);
    const el = tree as ElementNode;
    expect(el.properties?.raw).toBe("const x = 1");
    expect(el.properties?.["data-language"]).toBe("ts");
    expect(el.properties?.["data-title"]).toBe("example.ts");
  });

  it("does not overwrite existing data-language", () => {
    const tree: Node = {
      type: "element",
      tagName: "pre",
      properties: { "data-language": "python" },
      language: "ts",
      children: [],
    } as unknown as Node;
    postProcess()(tree);
    expect((tree as ElementNode).properties?.["data-language"]).toBe("python");
  });
});

describe("createDefaultRehypePlugins", () => {
  it("returns an array of plugins", () => {
    const plugins = createDefaultRehypePlugins();
    expect(Array.isArray(plugins)).toBe(true);
    expect(plugins.length).toBeGreaterThan(0);
  });
});

describe("createDefaultRemarkPlugins", () => {
  it("returns an array of plugins", () => {
    const plugins = createDefaultRemarkPlugins();
    expect(Array.isArray(plugins)).toBe(true);
    expect(plugins.length).toBeGreaterThan(0);
  });
});
