import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { AccordionsMdx } from "../components/AccordionsMdx";
import { AccordionMdx } from "../components/AccordionMdx";

describe("AccordionsMdx", () => {
  it("renders group with multiple accordions", () => {
    const { container } = render(
      <AccordionsMdx>
        <AccordionMdx title="First">Content 1</AccordionMdx>
        <AccordionMdx title="Second" icon="Code">
          Content 2
        </AccordionMdx>
      </AccordionsMdx>
    );
    expect(container.querySelectorAll(".mdx-accordion")).toHaveLength(2);
    expect(container.textContent).toContain("First");
    expect(container.textContent).toContain("Second");
  });

  it("renders with mdx-accordion-group class", () => {
    const { container } = render(
      <AccordionsMdx>
        <AccordionMdx title="A">x</AccordionMdx>
      </AccordionsMdx>
    );
    expect(container.querySelector(".mdx-accordion-group")).not.toBeNull();
  });

  it("does not crash with no children", () => {
    const { container } = render(<AccordionsMdx>{null}</AccordionsMdx>);
    expect(container.firstChild).not.toBeNull();
  });
});
