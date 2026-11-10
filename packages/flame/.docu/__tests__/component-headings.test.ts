import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { compileMdx } from "../node/mdx";

const gitDates = new Map([["component-headings.mdx", "2026-11-10"]]);

async function render(body: string) {
  const result = await compileMdx(
    `---\ntitle: Component headings\n---\n${body}\n`,
    "component-headings.mdx",
    gitDates
  );
  return { html: renderToStaticMarkup(result.content), tocs: result.tocs };
}

describe("headings inside components", () => {
  it("renders no h1–h6 in tabs, accordions, steps, cards, callouts or alerts", async () => {
    const { html, tocs } = await render(
      [
        "## Section",
        '::::tabs\n:::tab{title="One"}\n## Install\n:::\n:::tab{title="Two"}\n## Install\n:::\n::::',
        '::::accordions\n:::accordion{title="Acc"}\n### Accordion heading\n:::\n::::',
        '::::steps\n:::step{title="Step"}\n#### Step heading\n:::\n::::',
        ':::card{title="Card"}\n# Card heading\n:::',
        ":::tip\n##### Tip heading\n:::",
        "> [!NOTE]\n> ###### Alert heading",
      ].join("\n\n")
    );

    expect(html.match(/<h[1-6][\s>]/g)).toEqual(["<h2 "]);
    for (const text of [
      "Install",
      "Accordion heading",
      "Step heading",
      "Card heading",
      "Tip heading",
      "Alert heading",
    ]) {
      expect(html).toContain(`<p>${text}</p>`);
    }
    expect(tocs).toEqual([{ level: 2, text: "Section", href: "#section" }]);
  });
});
