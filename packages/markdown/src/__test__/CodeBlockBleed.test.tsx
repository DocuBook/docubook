/// <reference types="vite/client" />
import type { ReactNode } from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, act } from "@testing-library/react";
import { CodeBlock } from "../components/CodeBlockMdx";
import { StepsMdx, StepMdx } from "../components/StepperMdx";
import { AccordionMdx } from "../components/AccordionMdx";
import { AccordionsMdx } from "../components/AccordionsMdx";
import { TabsMdx, TabMdx } from "../components/TabsMdx";
import { Callout } from "../components/Callout";
import stylesCss from "../../styles.css?raw";

afterEach(() => {
  cleanup();
});

/** The selector of the phone full-bleed rule, read from the shipped stylesheet. */
function bleedSelector() {
  const media = stylesCss.match(/@media \(max-width: 639\.98px\) \{\s*([^{]+?)\s*\{/);
  if (!media) throw new Error("phone code-block rule not found in styles.css");
  return media[1];
}

async function renderBlock(wrap: (block: ReactNode) => ReactNode = (block) => block) {
  let container: HTMLElement;
  await act(async () => {
    ({ container } = render(
      <>
        {wrap(
          <CodeBlock raw="pnpm install" data-language="bash">
            <code className="language-bash">pnpm install</code>
          </CodeBlock>
        )}
      </>
    ));
  });
  const block = container!.querySelector(".code-block-container");
  if (!block) throw new Error("code block not rendered");
  return block;
}

describe("CodeBlock phone full-bleed", () => {
  const selector = bleedSelector();

  it("bleeds when used at the top level", async () => {
    expect((await renderBlock()).matches(selector)).toBe(true);
  });

  it("stays inset inside steps", async () => {
    const block = await renderBlock((b) => (
      <StepsMdx>
        <StepMdx title="Install">{b}</StepMdx>
      </StepsMdx>
    ));
    expect(block.matches(selector)).toBe(false);
  });

  it("stays inset inside an accordion and an accordion group", async () => {
    const single = await renderBlock((b) => <AccordionMdx title="Single">{b}</AccordionMdx>);
    expect(single.matches(selector)).toBe(false);
    cleanup();

    const grouped = await renderBlock((b) => (
      <AccordionsMdx>
        <AccordionMdx title="Grouped">{b}</AccordionMdx>
      </AccordionsMdx>
    ));
    expect(grouped.matches(selector)).toBe(false);
  });

  it("still bleeds inside tabs and callouts", async () => {
    const tab = await renderBlock((b) => (
      <TabsMdx>
        <TabMdx title="Bash">{b}</TabMdx>
      </TabsMdx>
    ));
    expect(tab.matches(selector)).toBe(true);
    cleanup();

    const callout = await renderBlock((b) => <Callout type="tip">{b}</Callout>);
    expect(callout.matches(selector)).toBe(true);
  });
});
