import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Callout } from "../components/Callout";

describe("Callout", () => {
  it("renders with the variant label as fallback title", () => {
    const { container } = render(<Callout type="warning">Warn</Callout>);
    const aside = container.querySelector("aside");
    expect(aside).not.toBeNull();
    expect(container.textContent).toContain("Warning");
    expect(container.textContent).toContain("Warn");
  });

  it("renders a custom title", () => {
    const { container } = render(
      <Callout type="tip" title="Heads up">
        Body
      </Callout>
    );
    expect(container.textContent).toContain("Heads up");
    expect(container.textContent).toContain("Body");
  });

  it("falls back to the label for each variant", () => {
    for (const type of ["tip", "info", "danger", "warning", "success"] as const) {
      const { container } = render(<Callout type={type}>x</Callout>);
      const label = type.charAt(0).toUpperCase() + type.slice(1);
      expect(container.textContent).toContain(label);
    }
  });

  it("icon follows the type automatically", () => {
    const { container } = render(<Callout type="info">x</Callout>);
    expect(container.querySelector("svg")).not.toBeNull();
  });
});
