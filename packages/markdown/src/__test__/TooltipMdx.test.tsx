import { describe, it, expect, afterEach } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { TooltipMdx } from "../components/TooltipMdx";

afterEach(cleanup);

describe("TooltipMdx", () => {
  it.each(["hover", "focus"])("links each trigger to its own tooltip on %s", (interaction) => {
    const { container } = render(
      <>
        <TooltipMdx text="First" tip="First description" />
        <TooltipMdx text="Second" tip="Second description" />
      </>
    );
    const triggers = container.querySelectorAll<HTMLElement>("[aria-describedby]");
    const ids = Array.from(triggers, (trigger) => trigger.getAttribute("aria-describedby"));
    expect(ids[0]).not.toBe(ids[1]);
    triggers.forEach((trigger, index) => {
      if (interaction === "hover") fireEvent.mouseEnter(trigger.parentElement!);
      else fireEvent.focus(trigger);
      const bubble = document.getElementById(ids[index]!);
      expect(bubble).not.toBeNull();
      expect(bubble?.getAttribute("role")).toBe("tooltip");
      expect(bubble?.textContent).toBe(index === 0 ? "First description" : "Second description");
      if (interaction === "hover") fireEvent.mouseLeave(trigger.parentElement!);
      else fireEvent.blur(trigger);
      expect(document.getElementById(ids[index]!)).toBeNull();
    });
  });
  it("renders the trigger text", () => {
    const { container } = render(<TooltipMdx text="DocuBook" tip="npx @docubook/create@latest" />);
    expect(container.textContent).toContain("DocuBook");
  });

  it("shows the bubble with tip content on hover", () => {
    const { container } = render(<TooltipMdx text="Hover" tip="bubble text" />);
    expect(container.querySelector("span[role='tooltip']")).toBeNull();
    fireEvent.mouseEnter(container.firstElementChild as Element);
    const bubble = container.querySelector("span[role='tooltip']");
    expect(bubble).not.toBeNull();
    expect(bubble?.textContent).toContain("bubble text");
  });

  it("auto-positions the bubble with fixed positioning", () => {
    const { container } = render(<TooltipMdx text="Hover" tip="Tooltip" />);
    fireEvent.mouseEnter(container.firstElementChild as Element);
    const bubble = container.querySelector("span[role='tooltip']") as HTMLElement;
    expect(bubble.style.position).toBe("fixed");
    // jsdom geometry is all zeros — EDGE clamp (8) and GAP (10) apply
    expect(bubble.style.left).toBe("8px");
    expect(bubble.style.top).toBe("10px");
  });

  it("renders fallback when no text prop", () => {
    const { container } = render(<TooltipMdx tip="Info" />);
    expect(container.textContent).toContain("?");
  });
});
