import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";
import { AccordionsMdx } from "../components/AccordionsMdx";
import { AccordionMdx } from "../components/AccordionMdx";

afterEach(cleanup);

describe("AccordionsMdx", () => {
  it("opens one panel at a time and allows closing the active panel", () => {
    const { getByRole } = render(
      <AccordionsMdx>
        <AccordionMdx title="First">Content 1</AccordionMdx>
        <AccordionMdx title="Second">Content 2</AccordionMdx>
      </AccordionsMdx>
    );
    const first = getByRole("button", { name: "First" });
    const second = getByRole("button", { name: "Second" });
    fireEvent.click(first);
    expect(getByRole("region", { name: "First" }).hidden).toBe(false);
    fireEvent.click(second);
    expect(first.getAttribute("aria-expanded")).toBe("false");
    const panel = getByRole("region", { name: "Second" });
    expect(panel.hidden).toBe(false);
    fireEvent.keyDown(second, { key: "Enter" });
    expect(second.getAttribute("aria-expanded")).toBe("false");
    expect(panel.hidden).toBe(true);
  });

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
