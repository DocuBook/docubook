import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { AccordionMdx } from "../components/AccordionMdx.js";

describe("AccordionMdx", () => {
  it("renders with valid icon", () => {
    const { container } = render(
      <AccordionMdx title="Test" icon="Home">
        Content
      </AccordionMdx>
    );
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.textContent).toContain("Test");
  });

  it("does not crash with invalid icon", () => {
    const { container } = render(
      <AccordionMdx title="Test" icon="__proto__">
        Content
      </AccordionMdx>
    );
    expect(container.textContent).toContain("Test");
    expect(container.textContent).toContain("Content");
  });

  it("renders children", () => {
    const { container } = render(
      <AccordionMdx title="Acc">
        <p>Child</p>
      </AccordionMdx>
    );
    expect(container.querySelector("p")).not.toBeNull();
  });
});
