import { describe, expect, it } from "vitest";
import { createEngine, pngSize } from "../renderer";

describe("createEngine", () => {
  it("renders a 1200×630 PNG", async () => {
    const engine = await createEngine([]);
    const png = await engine.render({
      type: "container",
      style: { display: "flex", width: 1200, height: 630, backgroundColor: "#fff" },
      children: [{ type: "text", text: "Hello", style: { fontSize: 64 } }],
    });
    expect(pngSize(png)).toEqual({ width: 1200, height: 630 });
  });

  it("draws markup in text as text", async () => {
    const engine = await createEngine([]);
    const tree = (text: string) => ({
      type: "container" as const,
      style: { display: "flex", width: 1200, height: 630, backgroundColor: "#fff" },
      children: [{ type: "text" as const, text, style: { fontSize: 40 } }],
    });
    const markup = await engine.render(tree('<img src="https://example.com/x.png">'));
    const plain = await engine.render(tree("plain"));
    expect(Buffer.from(markup).equals(Buffer.from(plain))).toBe(false);
  });

  it("finds characters the built-in font cannot draw", async () => {
    const engine = await createEngine([]);
    expect(engine.fontFamily).toBe('"Geist"');
    expect(await engine.missingGlyphs(["A", " ", "é", "—", "…", "©"])).toEqual([]);
    expect(await engine.missingGlyphs(["Ł", "→", "Ж", "設"])).toEqual(["Ł", "→", "Ж", "設"]);
  });
});

describe("pngSize", () => {
  it("reads the IHDR size and rejects other bytes", () => {
    const png = new Uint8Array(24);
    png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    new DataView(png.buffer).setUint32(16, 1200);
    new DataView(png.buffer).setUint32(20, 630);
    expect(pngSize(png)).toEqual({ width: 1200, height: 630 });
    expect(pngSize(new Uint8Array(24))).toBeUndefined();
    expect(pngSize(new Uint8Array(4))).toBeUndefined();
  });
});
