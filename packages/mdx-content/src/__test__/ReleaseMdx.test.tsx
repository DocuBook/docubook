import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ReleaseMdx, ChangesMdx } from "../components/ReleaseMdx";

describe("ReleaseMdx", () => {
  it("renders with all props", () => {
    const { container } = render(
      <ReleaseMdx version="1.10.1" date="2025-05-24" title="Bug Fixes">
        <ChangesMdx type="added">New feature</ChangesMdx>
        <ChangesMdx type="fixed">Bug fix</ChangesMdx>
      </ReleaseMdx>
    );
    expect(container.textContent).toContain("v1.10.1");
    expect(container.textContent).toContain("Bug Fixes");
    expect(container.textContent).toContain("New feature");
  });

  it("prepends v to version", () => {
    const { container } = render(<ReleaseMdx version="2.0.0" title="Major" />);
    expect(container.textContent).toContain("v2.0.0");
  });

  it("does not double v prefix", () => {
    const { container } = render(<ReleaseMdx version="v3.0.0" title="X" />);
    expect(container.textContent).toContain("v3.0.0");
    expect(container.textContent).not.toContain("vv3.0.0");
  });

  it("renders without date", () => {
    const { container } = render(<ReleaseMdx version="1.0.0" title="Init" />);
    expect(container.querySelector("section")).not.toBeNull();
  });
});

describe("ChangesMdx", () => {
  it("renders all change types without crash", () => {
    const types = ["added", "changed", "fixed", "improved", "deprecated", "removed"] as const;
    types.forEach((type) => {
      const { container } = render(<ChangesMdx type={type}>Content</ChangesMdx>);
      expect(container.textContent).toContain("Content");
    });
  });

  it("defaults to changed type", () => {
    const { container } = render(<ChangesMdx>Default</ChangesMdx>);
    expect(container.textContent).toContain("Changed");
  });
});
