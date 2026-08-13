import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { TreeMdx } from "../components/TreeMdx";

const ascii = `src/
├─ App.tsx
├─ index.tsx
└─ components/
│  ├─ Button.tsx
│  └─ Card.tsx`;

describe("TreeMdx", () => {
  it("parses ASCII tree and renders nodes", () => {
    const { container } = render(<TreeMdx>{ascii}</TreeMdx>);
    expect(container.querySelector('[role="tree"]')).toBeTruthy();
    expect(container.textContent).toContain("App.tsx");
    expect(container.textContent).toContain("Button.tsx");
  });

  it("nests piped children under their folder", () => {
    const { container } = render(<TreeMdx>{ascii}</TreeMdx>);
    const btns = Array.from(container.querySelectorAll('button[aria-label*="Collapse"]'));
    expect(btns.length).toBeGreaterThan(0);
    // components harus jadi folder (collapsible)
    const compBtn = btns.find((b) => b.getAttribute("aria-label")?.includes("components"));
    expect(compBtn).toBeTruthy();
  });

  it("Button and Card are file leaves (no collapse)", () => {
    const { container } = render(<TreeMdx>{ascii}</TreeMdx>);
    const allBtns = Array.from(container.querySelectorAll("button"));
    const leaves = allBtns.filter(
      (b) => b.textContent?.includes("Button.tsx") || b.textContent?.includes("Card.tsx")
    );
    // dirender sebagai row file, bukan folder collapsible
    expect(leaves.length).toBe(2);
    expect(leaves.every((b) => b.getAttribute("aria-expanded") === null)).toBe(true);
  });

  it("collects text from nested inline elements", () => {
    const { container } = render(
      <TreeMdx>
        <p>
          {"build()\n├─ onLoad("}
          <code>{"{filter}"}</code>
          {")"}
        </p>
      </TreeMdx>
    );
    expect(container.textContent).toContain("{filter}");
  });
});
