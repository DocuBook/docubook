import { describe, it, expect } from "vitest";
import { serialize, createDefaultRemarkPlugins } from "../index";

const options = {
  outputFormat: "program",
  parseFrontmatter: false,
  mdxOptions: { remarkPlugins: createDefaultRemarkPlugins() },
} as const;

describe("GFM alerts → DocuBook callouts", () => {
  it.each([
    ["NOTE", "Info", "Note"],
    ["TIP", "Tip", "Tip"],
    ["IMPORTANT", "GfmImportant", "Important"],
    ["WARNING", "Warning", "Warning"],
    ["CAUTION", "Danger", "Caution"],
  ] as const)("maps [!%s] to %s with the %s title", async (marker, component, label) => {
    const result = await serialize(`> [!${marker}]\n> Alert body text.`, options);
    const src = result.compiledSource;
    expect(src).toContain(component);
    expect(src).toContain(JSON.stringify(label));
    expect(src).toContain("Alert body text.");
    expect(src).not.toContain(`[!${marker}]`);
  });

  it("accepts lowercase markers", async () => {
    const result = await serialize("> [!note]\n> Lowercase marker.", options);
    const src = result.compiledSource;
    expect(src).toContain("Info");
    expect(src).toContain(JSON.stringify("Note"));
    expect(src).not.toContain("[!note]");
  });

  it("compiles in md format (v2 authored-JSX contract)", async () => {
    const result = await serialize("> [!WARNING]\n> Works in md too.", {
      ...options,
      format: "md",
    });
    const src = result.compiledSource;
    expect(src).toContain("Warning");
    expect(src).toContain("Works in md too.");
  });

  it("keeps rich body content (inline markup, lists, paragraphs)", async () => {
    const result = await serialize(
      "> [!TIP]\n> **bold body** and `code`\n>\n> - item one\n> - item two\n>\n> Second paragraph.",
      options
    );
    const src = result.compiledSource;
    expect(src).toContain("Tip");
    expect(src).toContain("bold body");
    expect(src).toContain("item one");
    expect(src).toContain("Second paragraph.");
  });

  it("renders an alert whose marker has no body", async () => {
    const result = await serialize("> [!CAUTION]", options);
    const src = result.compiledSource;
    expect(src).toContain("Danger");
    expect(src).toContain(JSON.stringify("Caution"));
  });

  it("leaves a blockquote without a marker untouched", async () => {
    const result = await serialize("> Just a plain quote.", options);
    const src = result.compiledSource;
    expect(src).toContain("blockquote");
    expect(src).toContain("Just a plain quote.");
    expect(src).not.toContain("Info");
    expect(src).not.toContain("Warning");
    expect(src).not.toContain("Danger");
  });

  it("only treats the marker as an alert on the first line", async () => {
    const result = await serialize("> Intro line\n> [!NOTE]\n> body", options);
    const src = result.compiledSource;
    expect(src).not.toContain("Info");
    expect(src).toContain("[!NOTE]");
  });

  it("supports sibling blockquotes and following content", async () => {
    const result = await serialize(
      "> [!NOTE]\n> First alert.\n\nAfter paragraph.\n\n> Plain quote.",
      options
    );
    const src = result.compiledSource;
    expect(src).toContain("Info");
    expect(src).toContain("First alert.");
    expect(src).toContain("After paragraph.");
    expect(src).toContain("Plain quote.");
  });
});
