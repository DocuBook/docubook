import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ButtonMdx } from "../components/ButtonMdx.js";

describe("ButtonMdx", () => {
  it("renders with valid icon", () => {
    const { container } = render(<ButtonMdx icon="Home" text="Click" />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.textContent).toContain("Click");
  });

  it("does not crash with invalid icon", () => {
    const { container } = render(<ButtonMdx icon="__proto__" text="Click" />);
    expect(container.textContent).toContain("Click");
  });

  it("renders without icon", () => {
    const { container } = render(<ButtonMdx text="No Icon" />);
    expect(container.textContent).toContain("No Icon");
  });
});
