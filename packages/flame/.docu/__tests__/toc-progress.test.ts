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
  const number = (html: string) => html.match(/<text[^>]*>([^<]*)<\/text>/)?.[1];
  // 28px ring with a 2.5px stroke
  const circumference = 2 * Math.PI * 12.75;

  it("is decorative and records the rounded percentage", () => {
    const html = render(0.4);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('data-toc-progress="40"');
  });

  it("shows the percentage inside the ring, without a % sign", () => {
    expect(number(render(0.5))).toBe("50");
    expect(number(render(0.875))).toBe("88");
    expect(render(0.5)).not.toContain("%");
  });

  it("is 28px, so two digits fit inside and the 32px bar button still holds it", () => {
    expect(render(0.5)).toMatch(/<svg[^>]* width="28" height="28" viewBox="0 0 28 28"/);
  });

  it("fills the arc in proportion to the progress, with a flat cap", () => {
    const html = render(0.25);
    expect(offset(html)).toBeCloseTo(circumference * 0.75);
    // A round cap makes a partial arc read as a loading spinner
    expect(html).toContain('stroke-linecap="butt"');
  });

  it("keeps the number upright while the ring starts at 12 o'clock", () => {
    const html = render(0.5);
    expect(html).toContain('<g transform="rotate(-90 14 14)">');
    expect(html).not.toMatch(/<svg[^>]*rotate/);
    expect(html.indexOf("</g>")).toBeLessThan(html.indexOf("<text"));
  });

  it("draws only the track and a muted 0 at the start, so it does not read as a radio button", () => {
    const html = render(0);
    expect(html.match(/<circle/g)).toHaveLength(1);
    expect(html).not.toContain("stroke-primary");
    expect(number(html)).toBe("0");
    expect(html).toContain("fill-base-content/60");
  });

  it("becomes a filled disc with a check at 100", () => {
    const html = render(1);
    expect(html).toContain('data-toc-progress="100"');
    expect(html).toContain("fill-primary");
    expect(html).toContain("stroke-primary-content");
    expect(html).not.toContain("<text");
  });

  it("clamps values outside 0..1", () => {
    expect(render(1.5)).toContain('data-toc-progress="100"');
    expect(render(-1)).toContain('data-toc-progress="0"');
  });

  it("skips the fill animation for reduced motion", () => {
    expect(render(0.5)).toContain("motion-reduce:transition-none");
  });
});
