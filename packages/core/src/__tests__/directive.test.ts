import { describe, it, expect } from "vitest";
import { serialize, createDefaultRemarkPlugins } from "../index";

describe("directives → MDX components (explicit-close contract)", () => {
  it("nests items inside wrappers (:::: wrapper, ::: item, ::: close)", async () => {
    const result = await serialize(
      '::::tabs{className="x"}\n:::tab{title="One"}\nA\n:::\n:::tab{title="Two"}\nB\n:::\n::::',
      {
        outputFormat: "program",
        parseFrontmatter: false,
        mdxOptions: { remarkPlugins: createDefaultRemarkPlugins() },
      }
    );
    const src = result.compiledSource;
    expect(src).toContain("Tabs");
    expect(src).toContain('"One"');
    expect(src).toContain('"Two"');
  });

  it("renders both sibling items (no trapping)", async () => {
    const result = await serialize(':::card{title="A"}\nOne\n:::\n:::card{title="B"}\nTwo\n:::', {
      outputFormat: "program",
      parseFrontmatter: false,
      mdxOptions: { remarkPlugins: createDefaultRemarkPlugins() },
    });
    const src = result.compiledSource;
    expect(src).toContain('"A"');
    expect(src).toContain('"B"');
  });

  it("callout variants map to their own components", async () => {
    const result = await serialize(
      ':::tip{title="Heads up"}\nBe careful\n:::\n\n:::info\nJust info\n:::',
      {
        outputFormat: "program",
        parseFrontmatter: false,
        mdxOptions: { remarkPlugins: createDefaultRemarkPlugins() },
      }
    );
    const src = result.compiledSource;
    expect(src).toContain("Tip");
    expect(src).toContain("Info");
    expect(src).toContain('"Heads up"');
  });

  it("single-colon text directives stay literal (URL ports intact)", async () => {
    const result = await serialize("Open http://localhost:3000 and :notacomponent", {
      outputFormat: "program",
      parseFrontmatter: false,
      mdxOptions: { remarkPlugins: createDefaultRemarkPlugins() },
    });
    const src = result.compiledSource;
    expect(src).toContain("localhost:3000");
    expect(src).toContain(":notacomponent");
  });

  it("inline :tooltip[label]{tip} stays in the paragraph", async () => {
    const result = await serialize('para :tooltip[hover me]{tip="bubble text"} inline', {
      outputFormat: "program",
      parseFrontmatter: false,
      mdxOptions: { remarkPlugins: createDefaultRemarkPlugins() },
    });
    const src = result.compiledSource;
    expect(src).toContain("Tooltip");
    expect(src).toContain('text: "hover me"');
    expect(src).toContain('tip: "bubble text"');
    expect(src).toContain("inline");
  });

  it("inline :tooltip[label] defaults the bubble to the label", async () => {
    const result = await serialize("para :tooltip[A text side husle] inline first.", {
      outputFormat: "program",
      parseFrontmatter: false,
      mdxOptions: { remarkPlugins: createDefaultRemarkPlugins() },
    });
    const src = result.compiledSource;
    expect(src).toContain('text: "A text side husle"');
    expect(src).toContain('tip: "A text side husle"');
  });

  it("inline :tooltip does not break URL literals", async () => {
    const result = await serialize("Open http://localhost:3000 now", {
      outputFormat: "program",
      parseFrontmatter: false,
      mdxOptions: { remarkPlugins: createDefaultRemarkPlugins() },
    });
    const src = result.compiledSource;
    expect(src).toContain("localhost:3000");
  });

  it("self-closing leaves render without children (file, youtube)", async () => {
    const result = await serialize('::youtube{videoId="x"}\n\n::file{name="a.ts"}', {
      outputFormat: "program",
      parseFrontmatter: false,
      mdxOptions: { remarkPlugins: createDefaultRemarkPlugins() },
    });
    const src = result.compiledSource;
    expect(src).toContain("Youtube");
    expect(src).toContain("File");
  });
});

describe("format: md — authored JSX tags disabled (v2 contract)", () => {
  it("drops authored JSX tags but keeps content as text", async () => {
    const result = await serialize('<Card title="Hi">konten</Card>', {
      outputFormat: "program",
      parseFrontmatter: false,
      format: "md",
      mdxOptions: { remarkPlugins: createDefaultRemarkPlugins() },
    });
    const src = result.compiledSource;
    expect(src).not.toContain("Card");
    expect(src).toContain("konten");
  });

  it("directives still compile to components in md format", async () => {
    const result = await serialize(':::card{title="Hi"}\nkonten\n:::', {
      outputFormat: "program",
      parseFrontmatter: false,
      format: "md",
      mdxOptions: { remarkPlugins: createDefaultRemarkPlugins() },
    });
    expect(result.compiledSource).toContain("Card");
  });
});
