import { describe, it, expect } from "vitest";
import { createMdxComponents } from "../registry";

describe("createMdxComponents", () => {
  it("ships the GFM important callout without registering an Important directive", () => {
    const components = createMdxComponents();
    expect(components.GfmImportant).toBeDefined();
    expect(components.Important).toBeUndefined();
  });
});
