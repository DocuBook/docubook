import { describe, it, expect, afterEach } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { TabsMdx, TabMdx } from "../components/TabsMdx";

afterEach(cleanup);

describe("TabsMdx", () => {
  it.each([
    ["ArrowRight", 0, 1],
    ["ArrowRight", 2, 0],
    ["ArrowLeft", 1, 0],
    ["ArrowLeft", 0, 2],
    ["Home", 2, 0],
    ["End", 0, 2],
  ])("%s from tab %i focuses and activates tab %i", (key, from, to) => {
    const { container } = render(
      <TabsMdx>
        <TabMdx title="One">First panel</TabMdx>
        <TabMdx title="Two">Second panel</TabMdx>
        <TabMdx title="Three">Third panel</TabMdx>
      </TabsMdx>
    );
    const tabs = container.querySelectorAll<HTMLButtonElement>("[role='tab']");
    const panels = container.querySelectorAll<HTMLDivElement>("[role='tabpanel']");
    fireEvent.click(tabs[from]);
    tabs[from].focus();

    expect(fireEvent.keyDown(tabs[from], { key })).toBe(false);
    expect(document.activeElement).toBe(tabs[to]);
    tabs.forEach((tab, index) => {
      expect(tab.tabIndex).toBe(index === to ? 0 : -1);
      expect(tab.getAttribute("aria-selected")).toBe(String(index === to));
      expect(tab.getAttribute("aria-controls")).toBe(panels[index].id);
      expect(panels[index].hidden).toBe(index !== to);
    });
  });

  it("keeps single-tab navigation safe and leaves unrelated keys alone", () => {
    const { container } = render(
      <TabsMdx>
        <TabMdx title="Only">Content</TabMdx>
      </TabsMdx>
    );
    const tab = container.querySelector<HTMLButtonElement>("[role='tab']")!;
    tab.focus();
    for (const key of ["ArrowLeft", "ArrowRight", "Home", "End"]) {
      expect(fireEvent.keyDown(tab, { key })).toBe(false);
      expect(document.activeElement).toBe(tab);
      expect(tab.getAttribute("aria-selected")).toBe("true");
    }
    expect(fireEvent.keyDown(tab, { key: "Tab" })).toBe(true);
    expect(fireEvent.keyDown(tab, { key: "ArrowDown" })).toBe(true);
  });
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
