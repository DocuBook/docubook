import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { CardsMdx } from "../components/CardsMdx";
import { CardMdx } from "../components/CardMdx";

describe("CardsMdx", () => {
  it("renders grid with children", () => {
    const { container } = render(
      <CardsMdx cols={2}>
        <CardMdx title="Card 1" icon="Heading1">
          Content 1
        </CardMdx>
        <CardMdx title="Card 2" icon="Heading2">
          Content 2
        </CardMdx>
      </CardsMdx>
    );
    expect(container.querySelector(".docubook-card-group")).not.toBeNull();
    expect(container.textContent).toContain("Card 1");
    expect(container.textContent).toContain("Card 2");
  });

  it("clamps cols to max 4", () => {
    const { container } = render(<CardsMdx cols={10}>child</CardsMdx>);
    const el = container.querySelector(".docubook-card-group") as HTMLElement;
    expect(el?.style.getPropertyValue("--docubook-card-group-template")).toContain("repeat(4");
  });

  it("defaults cols to 2", () => {
    const { container } = render(<CardsMdx>child</CardsMdx>);
    const el = container.querySelector(".docubook-card-group") as HTMLElement;
    expect(el?.style.getPropertyValue("--docubook-card-group-template")).toContain("repeat(2");
  });

  it("passes style prop", () => {
    const { container } = render(<CardsMdx style={{ gap: "2rem" }}>x</CardsMdx>);
    const el = container.querySelector(".docubook-card-group") as HTMLElement;
    expect(el?.style.gap).toBe("2rem");
  });

  it("does not inject inline style tag", () => {
    const { container } = render(<CardsMdx>x</CardsMdx>);
    expect(container.querySelector("style")).toBeNull();
  });
});
