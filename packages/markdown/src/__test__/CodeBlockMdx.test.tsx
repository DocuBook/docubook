import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, act } from "@testing-library/react";
import { CodeBlock } from "../components/CodeBlockMdx";

afterEach(() => {
  cleanup();
});

describe("CodeBlock", () => {
  it("renders with raw code and language", async () => {
    let container: HTMLElement;
    await act(async () => {
      ({ container } = render(
        <CodeBlock raw="const x = 1;" data-language="typescript" data-title="example.ts">
          <code className="language-typescript">const x = 1;</code>
        </CodeBlock>
      ));
    });
    expect(container!.querySelector(".code-block-container")).not.toBeNull();
    expect(container!.textContent).toContain("const x = 1;");
    expect(container!.textContent).toContain("example.ts");
  });

  it("renders without raw (no copy button)", async () => {
    let container: HTMLElement;
    await act(async () => {
      ({ container } = render(
        <CodeBlock>
          <code>hello</code>
        </CodeBlock>
      ));
    });
    expect(container!.querySelector(".code-block-container")).not.toBeNull();
  });

  it("renders with expandable props", async () => {
    const lines = Array.from({ length: 30 }, (_, i) => `line ${i}`).join("\n");
    let container: HTMLElement;
    await act(async () => {
      ({ container } = render(
        <CodeBlock raw={lines} data-expandable="true" data-expandable-lines="30">
          <code>{lines}</code>
        </CodeBlock>
      ));
    });
    expect(container!.querySelector(".code-block-container")).not.toBeNull();
  });

  it("resolves language from className", async () => {
    let container: HTMLElement;
    await act(async () => {
      ({ container } = render(
        <CodeBlock className="language-python" raw="print('hi')">
          <code>print('hi')</code>
        </CodeBlock>
      ));
    });
    expect(container!.textContent).toContain("python");
  });

  it("renders a dedicated header icon instead of the generic fallback", async () => {
    const renderIcon = async (language: string) => {
      let container: HTMLElement;
      await act(async () => {
        ({ container } = render(
          <CodeBlock raw="x" data-language={language}>
            <code>x</code>
          </CodeBlock>
        ));
      });
      return container!.querySelector(".code-block-header svg")?.innerHTML ?? "";
    };

    const fallback = await renderIcon("cobol");
    expect(fallback).not.toBe("");

    for (const language of [
      "env",
      "dotenv",
      "mdx",
      "vue",
      "svelte",
      "astro",
      "prisma",
      "jsonc",
      "tf",
      "terraform",
      "hcl",
    ]) {
      expect(await renderIcon(language)).not.toBe(fallback);
    }
  });

  it("does not crash with no children", async () => {
    let container: HTMLElement;
    await act(async () => {
      ({ container } = render(<CodeBlock raw="x" />));
    });
    expect(container!.querySelector(".code-block-container")).not.toBeNull();
  });
});
