import { describe, expect, it } from "vitest";
import type { Node, Parent } from "unist";
import {
  createDefaultRehypePlugins,
  createDefaultRemarkPlugins,
  preProcess,
  serialize,
} from "../../compile";
import { rehypeFileTree } from "../../plugins/rehypeFileTree";
import type { ElementNode } from "../../utils";

const ascii = "src/\n  App.tsx\n  components/\n    Button.tsx\n";

function rootWithFence(lang: string, code: string, meta?: string): Parent {
  return {
    type: "root",
    children: [
      {
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
      },
    ],
  } as unknown as Parent;
}

const first = (root: Parent) => root.children[0] as ElementNode;

describe("rehypeFileTree", () => {
  it("turns a filetree fence into a Tree element that carries the raw text", () => {
    const root = rootWithFence("filetree", ascii);
    rehypeFileTree()(root as Node);
    expect(first(root).tagName).toBe("Tree");
    expect(first(root).properties).toEqual({ content: ascii });
    expect(first(root).children).toEqual([]);
  });

  it("takes the title from the filetree:title shorthand", () => {
    const root = rootWithFence("filetree:my-app", ascii);
    rehypeFileTree()(root as Node);
    expect(first(root).properties).toEqual({ content: ascii, title: "my-app" });
  });

  it("takes the title from title= meta once preProcess has read it", () => {
    const root = rootWithFence("filetree", ascii, 'title="Project layout"');
    preProcess()(root as Node);
    rehypeFileTree()(root as Node);
    expect(first(root).properties).toEqual({ content: ascii, title: "Project layout" });
  });

  it("leaves other fences alone", () => {
    const root = rootWithFence("text", ascii);
    rehypeFileTree()(root as Node);
    expect(first(root).tagName).toBe("pre");
  });

  it("does not match languages that only start with filetree", () => {
    const root = rootWithFence("filetrees", ascii);
    rehypeFileTree()(root as Node);
    expect(first(root).tagName).toBe("pre");
  });
});

describe("```filetree through the default pipeline", () => {
  it("compiles to a Tree component with the indentation intact", async () => {
    const result = await serialize('```filetree title="my-app"\n' + ascii + "```\n", {
      mdxOptions: {
        rehypePlugins: createDefaultRehypePlugins(),
        remarkPlugins: createDefaultRemarkPlugins(),
      },
    });
    expect(result.compiledSource).toContain("Tree");
    // The indentation must survive: it is all that nests Button.tsx under components/.
    expect(result.compiledSource).toContain("\\n  components/\\n    Button.tsx");
    expect(result.compiledSource).toContain("my-app");
    // Prism never saw it, so no token markup leaks into the tree text.
    expect(result.compiledSource).not.toContain("token");
  });

  it("reads the filetree:title shorthand from the fence info string", async () => {
    const result = await serialize("```filetree:docs\n" + ascii + "```\n", {
      mdxOptions: {
        rehypePlugins: createDefaultRehypePlugins(),
        remarkPlugins: createDefaultRemarkPlugins(),
      },
    });
    expect(result.compiledSource).toMatch(/title: "docs"/);
    // rehype-code-titles must not have turned the shorthand into a code title bar.
    expect(result.compiledSource).not.toContain("rehype-code-title");
  });
});
