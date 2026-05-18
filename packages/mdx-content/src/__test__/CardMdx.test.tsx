import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { CardMdx } from "../components/CardMdx";

describe("CardMdx", () => {
  it("renders with valid icon", () => {
    const { container } = render(
      <CardMdx title="Card" icon="Home">
        Body
      </CardMdx>
    );
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.textContent).toContain("Card");
  });

  it("does not crash with invalid icon", () => {
    const { container } = render(
      <CardMdx title="Card" icon="__proto__">
        Body
      </CardMdx>
    );
    expect(container.textContent).toContain("Card");
    expect(container.textContent).toContain("Body");
  });

  it("renders children", () => {
    const { container } = render(
      <CardMdx title="Card">
        <span>Child</span>
      </CardMdx>
    );
    expect(container.querySelector("span")?.textContent).toBe("Child");
  });
});
