import { describe, it, expect } from "vitest";
import { cn } from "../src/cn";

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
});
