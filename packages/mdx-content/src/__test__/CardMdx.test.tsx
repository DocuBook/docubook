import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { CardMdx } from "../components/CardMdx.js";

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

  it("applies data-card-hover attribute when href is provided", () => {
    const { container } = render(
      <CardMdx title="Link Card" href="/docs">
        Body
      </CardMdx>
    );
    expect(container.querySelector("[data-card-hover]")).not.toBeNull();
  });

  it("does not inject inline style tag", () => {
    const { container } = render(
      <CardMdx title="Card" href="/docs">
        Body
      </CardMdx>
    );
    expect(container.querySelector("style")).toBeNull();
  });
});
