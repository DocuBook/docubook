import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { TabsMdx, TabMdx } from "../components/TabsMdx";

describe("TabsMdx", () => {
  it("renders tabs with multiple Tab children", () => {
    const { container } = render(
      <TabsMdx>
        <TabMdx title="Java">Java content</TabMdx>
        <TabMdx title="TypeScript">TS content</TabMdx>
      </TabsMdx>
    );
    expect(container.querySelectorAll("[role='tab']")).toHaveLength(2);
    expect(container.querySelector("[role='tabpanel']")?.textContent).toContain("Java content");
  });

  it("renders with className", () => {
    const { container } = render(
      <TabsMdx className="pt-5">
        <TabMdx title="One">Content</TabMdx>
      </TabsMdx>
    );
    expect(container.querySelector(".pt-5")).not.toBeNull();
  });

  it("does not crash with no children", () => {
    const { container } = render(<TabsMdx>{null}</TabsMdx>);
    expect(container.querySelector("[role='tablist']")).not.toBeNull();
  });

  it("does not crash with non-Tab children", () => {
    const { container } = render(
      <TabsMdx>
        <div>Not a tab</div>
      </TabsMdx>
    );
    expect(container.querySelector("[role='tablist']")).not.toBeNull();
  });
});

describe("TabMdx", () => {
  it("renders children directly", () => {
    const { container } = render(<TabMdx title="Test">Tab content</TabMdx>);
    expect(container.textContent).toBe("Tab content");
  });
});
