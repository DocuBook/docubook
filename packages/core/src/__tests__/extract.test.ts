import { describe, it, expect } from "vitest";
import {
  sluggify,
  extractTocsFromRawMdx,
  extractFrontmatter,
  extractFrontmatterWithContent,
} from "../extract";

describe("sluggify", () => {
  it("converts text to lowercase kebab-case", () => {
    expect(sluggify("Hello World")).toBe("hello-world");
  });

  it("removes special characters", () => {
    expect(sluggify("What's New?")).toBe("whats-new");
  });

  it("removes accents", () => {
    expect(sluggify("Café Résumé")).toBe("cafe-resume");
  });

  it("handles multiple spaces", () => {
    expect(sluggify("a   b   c")).toBe("a-b-c");
  });
});

describe("extractTocsFromRawMdx", () => {
  it("extracts h2 and h3 headings", () => {
    const mdx = `## First\n### Second\n## Third`;
    const tocs = extractTocsFromRawMdx(mdx);
    expect(tocs).toEqual([
      { level: 2, text: "First", href: "#first" },
      { level: 3, text: "Second", href: "#second" },
      { level: 2, text: "Third", href: "#third" },
    ]);
  });

  it("ignores h1 headings", () => {
    const mdx = `# Title\n## Section`;
    const tocs = extractTocsFromRawMdx(mdx);
    expect(tocs).toHaveLength(1);
    expect(tocs[0].text).toBe("Section");
  });

  it("ignores headings inside fenced code blocks", () => {
    const mdx = "```\n## Not a heading\n```\n## Real heading";
    const tocs = extractTocsFromRawMdx(mdx);
    expect(tocs).toHaveLength(1);
    expect(tocs[0].text).toBe("Real heading");
  });

  it("handles 4-backtick fences", () => {
    const mdx = "````\n## Inside\n````\n## Outside";
    const tocs = extractTocsFromRawMdx(mdx);
    expect(tocs).toHaveLength(1);
    expect(tocs[0].text).toBe("Outside");
  });

  it("returns empty array for content without headings", () => {
    const tocs = extractTocsFromRawMdx("Just some text");
    expect(tocs).toEqual([]);
  });

  it("uses rendered inline text and Unicode heading IDs", () => {
    expect(
      extractTocsFromRawMdx(
        "## Café Résumé\n## [Guide](https://example.com)\n## **Bold** `code` &amp; text"
      )
    ).toEqual([
      { level: 2, text: "Café Résumé", href: "#café-résumé" },
      { level: 2, text: "Guide", href: "#guide" },
      { level: 2, text: "Bold code & text", href: "#bold-code--text" },
    ]);
  });

  it("counts excluded heading levels when assigning duplicate IDs", () => {
    expect(extractTocsFromRawMdx("# Hello\n## Hello\n##### Hello\n## Hello")).toEqual([
      { level: 2, text: "Hello", href: "#hello-1" },
      { level: 2, text: "Hello", href: "#hello-3" },
    ]);
  });

  it("ignores frontmatter, indented code and tilde fences", () => {
    const source =
      "---\ntitle: |\n  ## Metadata\n---\n\n    ## Indented\n\n~~~~\n## Fenced\n~~~~~\n\n## Visible";
    expect(extractTocsFromRawMdx(source)).toEqual([
      { level: 2, text: "Visible", href: "#visible" },
    ]);
  });

  it("recognizes setext headings and headings inside directives", () => {
    expect(extractTocsFromRawMdx("Section\n-------\n\n:::note\n## Nested\n:::")).toEqual([
      { level: 2, text: "Section", href: "#section" },
      { level: 2, text: "Nested", href: "#nested" },
    ]);
  });

  it("strips trailing hashes from headings", () => {
    const mdx = `## Heading ##`;
    const tocs = extractTocsFromRawMdx(mdx);
    expect(tocs[0].text).toBe("Heading");
  });
});

describe("extractFrontmatter", () => {
  it("extracts YAML frontmatter", () => {
    const content = `---\ntitle: Hello\ndescription: World\n---\n# Content`;
    const fm = extractFrontmatter<{ title: string; description: string }>(content);
    expect(fm.title).toBe("Hello");
    expect(fm.description).toBe("World");
  });

  it("returns empty object for content without frontmatter", () => {
    const fm = extractFrontmatter<Record<string, unknown>>("# No frontmatter");
    expect(fm).toEqual({});
  });

  it("throws on malformed YAML", () => {
    const content = `---\ntitle: [\n---`;
    expect(() => extractFrontmatter(content)).toThrow("Failed to extract frontmatter");
  });
});

describe("extractFrontmatterWithContent", () => {
  it("returns frontmatter and stripped content", () => {
    const content = `---\ntitle: Test\n---\n## Hello`;
    const result = extractFrontmatterWithContent<{ title: string }>(content);
    expect(result.frontmatter.title).toBe("Test");
    expect(result.strippedContent.trim()).toBe("## Hello");
  });

  it("strips frontmatter block from content", () => {
    const content = `---\nkey: value\n---\nBody text`;
    const result = extractFrontmatterWithContent(content);
    expect(result.strippedContent).not.toContain("---");
    expect(result.strippedContent.trim()).toBe("Body text");
  });

  it("handles content without frontmatter", () => {
    const result = extractFrontmatterWithContent<Record<string, unknown>>("# No frontmatter");
    expect(result.frontmatter).toEqual({});
    expect(result.strippedContent.trim()).toBe("# No frontmatter");
  });
});
