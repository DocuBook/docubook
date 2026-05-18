import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { KbdMdx } from "../components/KbdMdx";

describe("KbdMdx", () => {
  it("renders windows key", () => {
    const { container } = render(<KbdMdx show="ctrl" />);
    expect(container.querySelector("kbd")?.textContent).toBe("Ctrl");
  });

  it("renders mac key", () => {
    const { container } = render(<KbdMdx show="cmd" type="mac" />);
    expect(container.querySelector("kbd")?.textContent).toBe("⌘");
  });

  it("renders single letter uppercase", () => {
    const { container } = render(<KbdMdx show="v" />);
    expect(container.querySelector("kbd")?.textContent).toBe("V");
  });

  it("renders unknown key as-is", () => {
    const { container } = render(<KbdMdx show="F12" />);
    expect(container.querySelector("kbd")?.textContent).toBe("F12");
  });

  it("passes style prop", () => {
    const { container } = render(<KbdMdx show="a" style={{ color: "red" }} />);
    expect(container.querySelector("kbd")?.style.color).toBe("red");
  });
});
