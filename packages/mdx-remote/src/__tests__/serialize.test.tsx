import { describe, it, expect } from "vitest";
import { serialize } from "../serialize.js";
import { compileMDX } from "../rsc.js";

// -------------------------------------------------------------------------
// serialize
// -------------------------------------------------------------------------
describe("serialize", () => {
  it("compiles basic MDX", async () => {
    const result = await serialize("# Hello\n\nWorld.", { parseFrontmatter: false });
    expect(result.compiledSource).toContain("MDXContent");
  });

  it("extracts frontmatter", async () => {
    const result = await serialize("---\ntitle: Test\n---\n\nBody", { parseFrontmatter: true });
    expect(result.frontmatter).toEqual({ title: "Test" });
  });

  it("returns empty frontmatter when none present", async () => {
    const result = await serialize("# No frontmatter", { parseFrontmatter: true });
    expect(result.frontmatter).toEqual({});
  });

  it("strips import/export statements by default", async () => {
    const result = await serialize('import { Component } from "./x";\n\n<Component />', {});
    expect(result.compiledSource).not.toContain("import ");
  });

  it("strips JS expressions in default blockJS=true mode", async () => {
    const result = await serialize("# {1 + 1}", {});
    expect(result.compiledSource).not.toContain("1 + 1");
  });

  it("preserves JS expressions when blockJS=false", async () => {
    const result = await serialize("# {1 + 1}", { blockJS: false });
    expect(result.compiledSource).toBeTruthy();
  });

  it("passes through custom remark plugins", async () => {
    const plugin = () => (tree: any) => {
      tree.children.push({ type: "paragraph", children: [{ type: "text", value: "injected" }] });
    };
    const result = await serialize("# Hi", { mdxOptions: { remarkPlugins: [plugin] as any } });
    expect(result.compiledSource).toContain("injected");
  });

  it("passes through custom rehype plugins", async () => {
    const plugin = () => (tree: any) => {
      if (tree.type === "root" && Array.isArray(tree.children)) {
        tree.children.push({
          type: "element",
          tagName: "p",
          children: [{ type: "text", value: "rehype-injected" }],
        });
      }
    };
    const result = await serialize("# Hi", { mdxOptions: { rehypePlugins: [plugin] as any } });
    expect(result.compiledSource).toContain("rehype-injected");
  });

  it("preserves original mdxOptions object (no mutation)", async () => {
    const options = { mdxOptions: { remarkPlugins: [] as any[] } };
    await serialize("# Test", options);
    expect(options.mdxOptions.remarkPlugins).toHaveLength(0);
  });

  // --- security (defense-in-depth with blockJS:false) ---
  it("throws on eval() with blockJS=false", async () => {
    await expect(serialize('# {eval("x")}', { blockJS: false })).rejects.toThrow(/not allowed/i);
  });

  it("throws on Function() call with blockJS=false", async () => {
    await expect(serialize("# {Function('return 1')()}", { blockJS: false })).rejects.toThrow(
      /not allowed/i,
    );
  });

  it("throws on dynamic import() with blockJS=false", async () => {
    await expect(serialize("# {import('node:fs')}", { blockJS: false })).rejects.toThrow(
      /not allowed/i,
    );
  });

  it("throws on new Function() with blockJS=false", async () => {
    await expect(serialize("# {new Function('')}", { blockJS: false })).rejects.toThrow(
      /not allowed/i,
    );
  });

  it("throws on tagged template eval with blockJS=false", async () => {
    await expect(serialize("# {eval`x`}", { blockJS: false })).rejects.toThrow(/not allowed/i);
  });

  // --- error handling ---
  it("throws formatted error on invalid MDX", async () => {
    // A closing JSX tag without opening triggers compile error.
    await expect(serialize("</close>", {})).rejects.toThrow(/mdx-remote/i);
  });
});

// -------------------------------------------------------------------------
// compileMDX (RSC path)
// -------------------------------------------------------------------------
describe("compileMDX", () => {
  it("returns content and frontmatter", async () => {
    const result = await compileMDX({
      source: "---\ntitle: Hello\n---\n\n# World",
      options: { parseFrontmatter: true },
    });
    expect(result.content).toBeTruthy();
    expect(result.frontmatter).toEqual({ title: "Hello" });
  });

  it("accepts custom components", async () => {
    const TestComp = ({ children }: { children?: React.ReactNode }) => <section>{children}</section>;
    const result = await compileMDX({
      source: "<TestComp>content</TestComp>",
      components: { TestComp },
    });
    expect(result.content).toBeTruthy();
  });

  it("supports generic frontmatter type", async () => {
    const { frontmatter } = await compileMDX<{ title: string }>({
      source: "---\ntitle: Hello\n---\n\n# Hi",
      options: { parseFrontmatter: true },
    });
    expect(frontmatter.title).toBe("Hello");
  });
});
