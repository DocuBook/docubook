import { describe, it, expect } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { TooltipMdx } from "../components/TooltipMdx";

describe("TooltipMdx", () => {
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
