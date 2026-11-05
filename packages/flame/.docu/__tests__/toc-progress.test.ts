import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { TocProgressCircle, tocProgress } from "../components/TocProgress";

describe("tocProgress", () => {
  it("is the active heading's position among the sections", () => {
    expect(tocProgress(0, 4, false)).toBe(0.25);
    expect(tocProgress(1, 4, false)).toBe(0.5);
    expect(tocProgress(3, 4, false)).toBe(1);
  });

  it("is 0 above the first heading", () => {
    expect(tocProgress(-1, 4, false)).toBe(0);
  });

  it("is complete at the end of the page, even before the last heading is active", () => {
    // A short last section never scrolls up to the anchor offset.
    expect(tocProgress(2, 4, true)).toBe(1);
    expect(tocProgress(-1, 4, true)).toBe(1);
  });

  it("is 0 without headings and never leaves 0..1", () => {
    expect(tocProgress(0, 0, true)).toBe(0);
    expect(tocProgress(9, 4, false)).toBe(1);
    expect(tocProgress(-5, 4, false)).toBe(0);
  });
});

describe("TocProgressCircle", () => {
  const render = (value: number) =>
    renderToStaticMarkup(createElement(TocProgressCircle, { value }));
  const offset = (html: string) => Number(html.match(/stroke-dashoffset="([^"]+)"/)?.[1]);
  const circumference = 2 * Math.PI * 8;

  it("is decorative and records the rounded percentage", () => {
    const html = render(0.4);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('data-toc-progress="40"');
  });

  it("fills the arc in proportion to the progress", () => {
    expect(offset(render(0.25))).toBeCloseTo(circumference * 0.75);
    expect(offset(render(1))).toBeCloseTo(0);
  });

  it("draws only the track at 0, so a round cap shows no dot", () => {
    const html = render(0);
    expect(html.match(/<circle/g)).toHaveLength(1);
    expect(html).not.toContain("stroke-primary");
  });

  it("clamps values outside 0..1", () => {
    expect(render(1.5)).toContain('data-toc-progress="100"');
    expect(render(-1)).toContain('data-toc-progress="0"');
  });

  it("skips the fill animation for reduced motion", () => {
    expect(render(0.5)).toContain("motion-reduce:transition-none");
  });
});
