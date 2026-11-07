import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";
import { AccordionMdx } from "../components/AccordionMdx";

afterEach(cleanup);

describe("AccordionMdx", () => {
  it("toggles its labelled panel with click, Enter and Space", () => {
    const { getByRole } = render(<AccordionMdx title="Details">Content</AccordionMdx>);
    const trigger = getByRole("button", { name: "Details" });
    const panel = getByRole("region", { hidden: true });
    expect(trigger.getAttribute("aria-controls")).toBe(panel.id);
    expect(panel.getAttribute("aria-labelledby")).toBe(trigger.id);
    expect(panel.hidden).toBe(true);

    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(panel.hidden).toBe(false);
    fireEvent.keyDown(trigger, { key: "Enter" });
    expect(panel.hidden).toBe(true);
    fireEvent.keyDown(trigger, { key: " " });
    expect(panel.hidden).toBe(false);
  });

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
