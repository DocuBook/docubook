import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { NoteMdx } from "../components/NoteMdx.js";

describe("NoteMdx", () => {
  it("renders with default type", () => {
    const { container } = render(<NoteMdx>Hello</NoteMdx>);
    expect(container.querySelector("aside")).not.toBeNull();
    expect(container.textContent).toContain("Hello");
  });

  it("renders with valid type", () => {
    const { container } = render(<NoteMdx type="warning">Warn</NoteMdx>);
    const aside = container.querySelector("aside");
    expect(aside).not.toBeNull();
    expect(container.textContent).toContain("Warning");
    expect(container.textContent).toContain("Warn");
  });

  it("does not crash with invalid type", () => {
    // @ts-expect-error testing invalid type prop
    const { container } = render(<NoteMdx type={"hack-the-planet"}>Content</NoteMdx>);
    expect(container.querySelector("aside")).not.toBeNull();
    expect(container.textContent).toContain("Content");
  });

  it("renders custom title", () => {
    const { container } = render(<NoteMdx title="Custom Title">Body</NoteMdx>);
    expect(container.textContent).toContain("Custom Title");
  });

  it("renders children content", () => {
    const { container } = render(
      <NoteMdx type="success">
        <p>Nested child</p>
      </NoteMdx>
    );
    expect(container.querySelector("p")?.textContent).toBe("Nested child");
  });

  it("passes className and style props", () => {
    const { container } = render(
      <NoteMdx className="custom" style={{ marginTop: 10 }}>
        Test
      </NoteMdx>
    );
    const aside = container.querySelector("aside");
    expect(aside?.className).toBe("custom");
    expect(aside?.style.marginTop).toBe("10px");
  });
});
