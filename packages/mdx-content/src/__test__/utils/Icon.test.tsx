import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { resolveLucideIcon } from "../../utils/Icon";

describe("resolveLucideIcon", () => {
  it("renders a valid icon", () => {
    const icon = resolveLucideIcon("Home");
    const { container } = render(<>{icon}</>);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("returns undefined for unknown icon", () => {
    expect(resolveLucideIcon("NonExistentIcon123")).toBeUndefined();
  });

  it("returns undefined for prototype chain keys", () => {
    expect(resolveLucideIcon("__proto__")).toBeUndefined();
    expect(resolveLucideIcon("constructor")).toBeUndefined();
    expect(resolveLucideIcon("toString")).toBeUndefined();
  });

  it("returns undefined when no icon provided", () => {
    expect(resolveLucideIcon()).toBeUndefined();
    expect(resolveLucideIcon("")).toBeUndefined();
  });

  it("trims whitespace from icon name", () => {
    const icon = resolveLucideIcon(" Home ");
    const { container } = render(<>{icon}</>);
    expect(container.querySelector("svg")).not.toBeNull();
  });
});
