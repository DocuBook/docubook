import { describe, it, expect } from "vitest";
import { serialize } from "../serialize.js";

describe("serialize", () => {
  it("compiles basic MDX", async () => {
    const result = await serialize("# Hello\n\nWorld.", { parseFrontmatter: false });
    expect(result.compiledSource).toBeTruthy();
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
    // Compiled output should not contain the expression
    expect(result.compiledSource).not.toContain("1 + 1");
  });

  it("preserves JS expressions when blockJS=false", async () => {
    const result = await serialize("# {1 + 1}", { blockJS: false });
    expect(result.compiledSource).toBeTruthy();
  });

  it("throws on dangerous global access with blockJS=false", async () => {
    await expect(
      serialize('# {eval("alert(1)")}', { blockJS: false }),
    ).rejects.toThrow(/not allowed/i);
  });

  it("throws on dynamic import with blockJS=false", async () => {
    await expect(
      serialize("# {import('node:fs')}", { blockJS: false }),
    ).rejects.toThrow(/not allowed/i);
  });

  it("throws on Function constructor via blockJS=false", async () => {
    await expect(
      serialize("# {new Function('alert(1)')}", { blockJS: false }),
    ).rejects.toThrow(/not allowed/i);
  });
});
