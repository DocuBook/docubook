import { describe, expect, it } from "vitest";
import { createDefaultRemarkPlugins, extractTocsFromRawMdx, serialize } from "../../index";

const ALL_LEVELS = "# One\n## Two\n### Three\n#### Four\n##### Five\n###### Six";

async function compile(source: string): Promise<string> {
  const result = await serialize(source, {
    outputFormat: "program",
    parseFrontmatter: false,
    format: "md",
    mdxOptions: { remarkPlugins: createDefaultRemarkPlugins() },
  });
  return result.compiledSource;
}

const HEADING = /_components\.h[1-6]\b/;

describe("remarkComponentHeadings", () => {
  it.each([
    ["callout", `:::tip\n${ALL_LEVELS}\n:::`],
    ["card", `:::card{title="Card"}\n${ALL_LEVELS}\n:::`],
    ["tabs", `::::tabs\n:::tab{title="One"}\n${ALL_LEVELS}\n:::\n::::`],
    ["accordions", `::::accordions\n:::accordion{title="Acc"}\n${ALL_LEVELS}\n:::\n::::`],
    ["steps", `::::steps\n:::step{title="Step"}\n${ALL_LEVELS}\n:::\n::::`],
    ["GitHub alert", `> [!NOTE]\n${ALL_LEVELS.replace(/^/gm, "> ")}`],
  ])("renders no h1–h6 inside a %s", async (_, source) => {
    const src = await compile(source);
    expect(src).not.toMatch(HEADING);
    for (const text of ["One", "Two", "Three", "Four", "Five", "Six"]) {
      expect(src).toContain(JSON.stringify(text));
    }
  });

  it("keeps the heading's inline content as a paragraph", async () => {
    const src = await compile(":::tip\n## Use **bold** and `code`\n:::");
    expect(src).not.toMatch(HEADING);
    expect(src).toContain("_components.p");
    expect(src).toContain("_components.strong");
    expect(src).toContain("_components.code");
  });

  it("leaves headings outside components untouched", async () => {
    const src = await compile("## Section\n\n:::tip\n## Inside\n:::\n\n### After");
    expect(src).toContain("_components.h2");
    expect(src).toContain("_components.h3");
    expect(src.match(/_components\.h2\b/g)).toHaveLength(1);
  });

  it("keeps a plain blockquote's heading (not a component)", async () => {
    const src = await compile("> ## Quoted heading");
    expect(src).toContain("_components.h2");
  });

  it("keeps component headings out of the TOC", () => {
    const tocs = extractTocsFromRawMdx(
      '## Section\n\n::::tabs\n:::tab{title="One"}\n## Install\n:::\n:::tab{title="Two"}\n## Install\n:::\n::::'
    );
    expect(tocs).toEqual([{ level: 2, text: "Section", href: "#section" }]);
  });
});
