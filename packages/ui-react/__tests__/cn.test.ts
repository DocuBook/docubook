import { describe, it, expect } from "vitest";
import { cn } from "../src/utils/cn";

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("btn", "btn-primary")).toBe("btn btn-primary");
  });

  it("filters falsy values", () => {
    expect(cn("btn", false, null, undefined, "", "btn-lg")).toBe("btn btn-lg");
  });

  it("returns empty string for no valid inputs", () => {
    expect(cn(false, null, undefined)).toBe("");
  });

  it("lets a later utility override a conflicting one", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("keeps a text color and a font size together", () => {
    expect(cn("text-base-content/60 text-sm")).toBe("text-base-content/60 text-sm");
  });

  it("understands Tailwind v4 class syntax", () => {
    // Trailing important modifier and CSS-variable shorthand are v4-only
    expect(cn("p-2!", "p-4!")).toBe("p-4!");
    expect(cn("p-2", "p-(--gap)")).toBe("p-(--gap)");
  });
});
