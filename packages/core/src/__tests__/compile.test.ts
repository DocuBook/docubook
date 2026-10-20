import { describe, it, expect } from "vitest";
import type { Node } from "unist";
import {
  preProcess,
  postProcess,
  createDefaultRehypePlugins,
  createDefaultRemarkPlugins,
  serialize,
} from "../compile";
import type { ElementNode } from "../utils";

function buildPreTree(lang: string, code: string, meta?: string): Node {
  return {
    type: "element",
    tagName: "pre",
    properties: {},
    children: [
      {
        type: "element",
        tagName: "code",
        properties: { className: [`language-${lang}`] },
        ...(meta ? { data: { meta } } : {}),
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

  it("extracts title from meta as a fallback", () => {
    const tree = buildPreTree("python", "print('hi')", 'title="main.py"');
    preProcess()(tree);
    const el = tree as ElementNode;
    expect(el.language).toBe("python");
    expect(el.codeTitle).toBe("main.py");
  });

  it("extracts single-quoted meta title", () => {
    const tree = buildPreTree("python", "print('hi')", "title='main.py'");
    preProcess()(tree);
    expect((tree as ElementNode).codeTitle).toBe("main.py");
  });

  it("keeps other meta options intact when extracting title", () => {
    const meta = 'title="main.py" showLineNumbers {3-4} Expandable';
    const tree = buildPreTree("python", "print('hi')", meta);
    preProcess()(tree);
    const el = tree as ElementNode;
    expect(el.codeTitle).toBe("main.py");
    expect(el.children?.[0]).toMatchObject({ data: { meta } });
  });

  it("extracts title inside braces", () => {
    const tree = buildPreTree("python", "print('hi')", '{title="main.py"}');
    preProcess()(tree);
    expect((tree as ElementNode).codeTitle).toBe("main.py");
  });

  it("extracts title with spaces around the equals sign", () => {
    const tree = buildPreTree("python", "print('hi')", 'title = "main.py"');
    preProcess()(tree);
    expect((tree as ElementNode).codeTitle).toBe("main.py");
  });

  it("unescapes quotes inside the title", () => {
    const tree = buildPreTree("python", "print('hi')", 'title="a\\"b.py"');
    preProcess()(tree);
    expect((tree as ElementNode).codeTitle).toBe('a"b.py');
  });

  it("ignores malformed title syntax without throwing", () => {
    for (const meta of ['title="main.py', "title='main.py", "title=", "title", '{title="}']) {
      const tree = buildPreTree("python", "print('hi')", meta);
      expect(() => preProcess()(tree)).not.toThrow();
      expect((tree as ElementNode).codeTitle).toBeUndefined();
    }
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

  it("does not throw on a fence language refractor does not register", async () => {
    const result = await serialize("```env\nAPI_URL=https://example.com\n```\n", {
      mdxOptions: {
        rehypePlugins: createDefaultRehypePlugins(),
        remarkPlugins: createDefaultRemarkPlugins(),
      },
    });

    expect(result.compiledSource).toContain("API_URL");
  });

  it("supports title attribute as a fence meta fallback", async () => {
    const result = await serialize(
      '```python title="main.py" showLineNumbers {1}\nprint("hi")\n```\n',
      {
        mdxOptions: {
          rehypePlugins: createDefaultRehypePlugins(),
          remarkPlugins: createDefaultRemarkPlugins(),
        },
      }
    );

    expect(result.compiledSource).toContain("main.py");
    expect(result.compiledSource).toContain("python");
  });

  it("keeps lang:title syntax as the primary title source", async () => {
    const result = await serialize('```python:app.py title="main.py"\nprint("hi")\n```\n', {
      mdxOptions: {
        rehypePlugins: createDefaultRehypePlugins(),
        remarkPlugins: createDefaultRemarkPlugins(),
      },
    });

    expect(result.compiledSource).toContain("app.py");
    expect(result.compiledSource).not.toContain("main.py");
  });

  it("still compiles when the title meta is malformed", async () => {
    const result = await serialize('```python title="main.py\nprint("hi")\n```\n', {
      mdxOptions: {
        rehypePlugins: createDefaultRehypePlugins(),
        remarkPlugins: createDefaultRemarkPlugins(),
      },
    });

    expect(result.compiledSource).toContain("print");
  });
});

describe("createDefaultRemarkPlugins", () => {
  it("returns an array of plugins", () => {
    const plugins = createDefaultRemarkPlugins();
    expect(Array.isArray(plugins)).toBe(true);
    expect(plugins.length).toBeGreaterThan(0);
  });
});
