import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { StepsMdx, StepMdx } from "../components/StepperMdx";

describe("StepperMdx", () => {
  it("renders steps with auto-numbered items", () => {
    const { container } = render(
      <StepsMdx>
        <StepMdx title="Clone repo">git clone ...</StepMdx>
        <StepMdx title="Install deps">pnpm install</StepMdx>
        <StepMdx title="Run dev">pnpm dev</StepMdx>
      </StepsMdx>
    );
    expect(container.querySelector("ol")).not.toBeNull();
    expect(container.querySelectorAll("li")).toHaveLength(3);
    expect(container.textContent).toContain("Clone repo");
  });

  it("renders single step without vertical line", () => {
    const { container } = render(
      <StepsMdx>
        <StepMdx title="Only step">Content</StepMdx>
      </StepsMdx>
    );
    expect(container.querySelectorAll("li")).toHaveLength(1);
  });

  it("StepMdx renders without children", () => {
    const { container } = render(
      <StepsMdx>
        <StepMdx title="No content" />
      </StepsMdx>
    );
    expect(container.textContent).toContain("No content");
  });

  it("passes className and style", () => {
    const { container } = render(
      <StepsMdx className="custom" style={{ gap: 10 }}>
        <StepMdx title="A">x</StepMdx>
      </StepsMdx>
    );
    expect(container.querySelector("ol")?.className).toContain("custom");
  });
});
