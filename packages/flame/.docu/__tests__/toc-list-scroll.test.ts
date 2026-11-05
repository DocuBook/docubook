import { describe, it, expect } from "vitest";
import { revealScrollTop } from "../components/toc-list-scroll";

// A list 300px tall at the top of the viewport, holding 20 entries of 30px.
const list = (scrollTop = 0) => ({ top: 0, height: 300, scrollTop, scrollHeight: 600 });
// An entry's viewport box for its index, given how far the list is scrolled.
const entry = (index: number, scrollTop = 0) => ({ top: index * 30 - scrollTop, height: 30 });

describe("revealScrollTop", () => {
  describe("center, when the list opens", () => {
    it("brings an entry far down the list into its middle", () => {
      // Entry 12 sits at 360..390 in scroll space; centered means 360 - 135
      expect(revealScrollTop(list(), entry(12), "center")).toBe(225);
    });

    it("clamps at the end of the list for the last entry", () => {
      expect(revealScrollTop(list(), entry(19), "center")).toBe(300);
    });

    it("stays at the top for the first entries", () => {
      expect(revealScrollTop(list(), entry(1), "center")).toBe(0);
    });

    it("works from a list that is already scrolled", () => {
      expect(revealScrollTop(list(200), entry(12, 200), "center")).toBe(225);
    });
  });

  describe("nearest, while the list stays open", () => {
    it("does not move when the entry is in view", () => {
      expect(revealScrollTop(list(100), entry(6, 100), "nearest")).toBeNull();
    });

    it("scrolls down just enough for an entry below the view, plus the margin", () => {
      // Entry 12 ends at 390; the view ends at 300, so 390 + 8 - 300
      expect(revealScrollTop(list(), entry(12), "nearest")).toBe(98);
    });

    it("scrolls up just enough for an entry above the view, minus the margin", () => {
      // Entry 5 starts at 150 while the view starts at 200
      expect(revealScrollTop(list(200), entry(5, 200), "nearest")).toBe(142);
    });

    it("never scrolls past either end", () => {
      expect(revealScrollTop(list(50), entry(0, 50), "nearest")).toBe(0);
      expect(revealScrollTop(list(), entry(19), "nearest")).toBe(300);
    });
  });

  it("returns 0 for a list that does not scroll", () => {
    const short = { top: 0, height: 300, scrollTop: 0, scrollHeight: 300 };
    expect(revealScrollTop(short, entry(8), "center")).toBe(0);
  });

  it("measures from the list's own top, not the viewport's", () => {
    // The list starts 120px down, under the bar's button row
    const placed = { top: 120, height: 300, scrollTop: 0, scrollHeight: 600 };
    expect(revealScrollTop(placed, { top: 120 + 360, height: 30 }, "center")).toBe(225);
  });
});
