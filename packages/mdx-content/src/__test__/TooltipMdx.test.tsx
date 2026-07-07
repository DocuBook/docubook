import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { TooltipMdx } from "../components/TooltipMdx.js";

describe("TooltipMdx", () => {
  it("renders with text and tip props", () => {
    const { container } = render(<TooltipMdx text="DocuBook" tip="npx @docubook/create@latest" />);
    expect(container.textContent).toContain("DocuBook");
  });

  it("renders with side=bottom", () => {
    const { container } = render(<TooltipMdx text="Hover" tip="Tooltip" side="bottom" />);
    expect(container.querySelector("[data-tooltip-side='bottom']")).not.toBeNull();
  });

  it("renders fallback when no text prop", () => {
    const { container } = render(<TooltipMdx tip="Info" />);
    expect(container.textContent).toContain("?");
  });

  it("passes className and style", () => {
    const { container } = render(
      <TooltipMdx text="X" tip="Y" className="tip" style={{ margin: 5 }} />
    );
    expect(container.querySelector(".tip")).not.toBeNull();
  });
});
