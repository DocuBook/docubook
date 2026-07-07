import { describe, it, expect } from "vitest";
import { hexToRgb, rgbToHsl, hexToHsl, hslToString, generateScale } from "../hex-to-hsl.js";
import { expectedScaleKeys } from "../__fixtures__/themes.js";

describe("hexToRgb", () => {
  it("converts full 6-digit hex with #", () => {
    expect(hexToRgb("#3B82F6")).toEqual({ r: 59, g: 130, b: 246 });
  });

  it("converts full 6-digit hex without #", () => {
    expect(hexToRgb("3B82F6")).toEqual({ r: 59, g: 130, b: 246 });
  });

  it("converts lowercase hex", () => {
    expect(hexToRgb("#3b82f6")).toEqual({ r: 59, g: 130, b: 246 });
  });

  it("expands 3-digit shorthand #RGB", () => {
    expect(hexToRgb("#fff")).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("expands 3-digit shorthand without #", () => {
    expect(hexToRgb("fff")).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("expands #000 to black", () => {
    expect(hexToRgb("#000")).toEqual({ r: 0, g: 0, b: 0 });
  });

  it("expands #f00 to red", () => {
    expect(hexToRgb("#f00")).toEqual({ r: 255, g: 0, b: 0 });
  });

  it("handles common colors", () => {
    expect(hexToRgb("#FF0000")).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb("#00FF00")).toEqual({ r: 0, g: 255, b: 0 });
    expect(hexToRgb("#0000FF")).toEqual({ r: 0, g: 0, b: 255 });
  });

  it("trims whitespace", () => {
    expect(hexToRgb("  #fff  ")).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("throws for invalid hex characters", () => {
    expect(() => hexToRgb("#GGG")).toThrow("Invalid hex color");
  });

  it("throws for invalid hex characters RRGGBB", () => {
    expect(() => hexToRgb("#GGGFFF")).toThrow("Invalid hex color");
  });

  it("throws for too short hex", () => {
    expect(() => hexToRgb("#ff")).toThrow("Invalid hex color");
  });

  it("throws for too long hex", () => {
    expect(() => hexToRgb("#ffffff0")).toThrow("Invalid hex color");
  });

  it("throws for empty string", () => {
    expect(() => hexToRgb("")).toThrow("Invalid hex color");
  });

  it("throws for null-like string", () => {
    // 4 chars but invalid hex
    expect(() => hexToRgb("#xyz")).toThrow("Invalid hex color");
  });
});

describe("rgbToHsl", () => {
  it("converts primary blue #3B82F6", () => {
    // rgb(59, 130, 246) → hsl(217, 91%, 60%)
    const result = rgbToHsl(59, 130, 246);
    expect(result.h).toBe(217);
    expect(result.s).toBe(91);
    expect(result.l).toBe(60);
  });

  it("converts white (255,255,255) to hsl(0,0%,100%)", () => {
    const result = rgbToHsl(255, 255, 255);
    expect(result).toEqual({ h: 0, s: 0, l: 100 });
  });

  it("converts black (0,0,0) to hsl(0,0%,0%)", () => {
    const result = rgbToHsl(0, 0, 0);
    expect(result).toEqual({ h: 0, s: 0, l: 0 });
  });

  it("converts red (255,0,0) to hsl(0,100%,50%)", () => {
    const result = rgbToHsl(255, 0, 0);
    expect(result).toEqual({ h: 0, s: 100, l: 50 });
  });

  it("converts green (0,255,0) to hsl(120,100%,50%)", () => {
    const result = rgbToHsl(0, 255, 0);
    expect(result).toEqual({ h: 120, s: 100, l: 50 });
  });

  it("converts blue (0,0,255) to hsl(240,100%,50%)", () => {
    const result = rgbToHsl(0, 0, 255);
    expect(result).toEqual({ h: 240, s: 100, l: 50 });
  });

  it("converts gray (128,128,128) to hsl(0,0%,50%)", () => {
    const result = rgbToHsl(128, 128, 128);
    expect(result).toEqual({ h: 0, s: 0, l: 50 });
  });

  it("converts dark purple (128,0,128) to hsl(300,100%,25%)", () => {
    const result = rgbToHsl(128, 0, 128);
    expect(result).toEqual({ h: 300, s: 100, l: 25 });
  });

  it("converts deep orange (255,128,0) to hsl(30,100%,50%)", () => {
    const result = rgbToHsl(255, 128, 0);
    expect(result).toEqual({ h: 30, s: 100, l: 50 });
  });
});

describe("hexToHsl", () => {
  it("converts #3B82F6 to blue HSL", () => {
    const result = hexToHsl("#3B82F6");
    expect(result.h).toBe(217);
    expect(result.s).toBe(91);
    expect(result.l).toBe(60);
  });

  it("converts #fff to white HSL", () => {
    expect(hexToHsl("#fff")).toEqual({ h: 0, s: 0, l: 100 });
  });

  it("converts #000 to black HSL", () => {
    expect(hexToHsl("#000")).toEqual({ h: 0, s: 0, l: 0 });
  });

  it("converts hex without #", () => {
    const result = hexToHsl("3B82F6");
    expect(result.h).toBe(217);
  });

  it("throws for invalid hex", () => {
    expect(() => hexToHsl("#GGG")).toThrow("Invalid hex color");
  });
});

describe("hslToString", () => {
  it("formats individual values", () => {
    expect(hslToString(210, 81, 56)).toBe("210 81% 56%");
  });

  it("formats from HslColor object", () => {
    expect(hslToString({ h: 210, s: 81, l: 56 })).toBe("210 81% 56%");
  });

  it("formats zero values", () => {
    expect(hslToString(0, 0, 0)).toBe("0 0% 0%");
  });

  it("formats 100% values", () => {
    expect(hslToString(240, 100, 50)).toBe("240 100% 50%");
  });

  it("formats decimal hue", () => {
    expect(hslToString(210.5, 81, 56)).toBe("210.5 81% 56%");
  });
});

describe("generateScale", () => {
  it("generates all required root keys", () => {
    const scale = generateScale({ h: 210, s: 81, l: 56 });
    expect(Object.keys(scale.root).sort()).toEqual(expectedScaleKeys.sort());
  });

  it("generates all required dark keys", () => {
    const scale = generateScale({ h: 210, s: 81, l: 56 });
    expect(Object.keys(scale.dark).sort()).toEqual(expectedScaleKeys.sort());
  });

  it("uses primary hue in root primary value", () => {
    const scale = generateScale({ h: 210, s: 81, l: 56 });
    expect(scale.root.primary).toMatch(/^210/);
  });

  it("uses primary hue in root ring value", () => {
    const scale = generateScale({ h: 210, s: 81, l: 56 });
    expect(scale.root.ring).toMatch(/^210/);
  });

  it("generates destructive as red-based regardless of primary", () => {
    const scale = generateScale({ h: 120, s: 70, l: 45 });
    expect(scale.root.destructive).toMatch(/^0/);
    expect(scale.dark.destructive).toMatch(/^0/);
  });

  it("generates radius as 0.5rem", () => {
    const scale = generateScale({ h: 210, s: 81, l: 56 });
    expect(scale.root.radius).toBe("0.5rem");
    expect(scale.dark.radius).toBe("0.5rem");
  });

  it("accent hue shifts by +15 from primary", () => {
    const scale = generateScale({ h: 200, s: 70, l: 50 });
    expect(scale.root.accent).toMatch(/^215/);
  });

  it("accent hue caps at 360", () => {
    const scale = generateScale({ h: 350, s: 70, l: 50 });
    expect(scale.root.accent).toMatch(/^360/);
  });

  it("handles low saturation primary", () => {
    const scale = generateScale({ h: 210, s: 5, l: 50 });
    expect(scale.root.background).toMatch(/^210 5%/);
  });

  it("handles high saturation primary", () => {
    const scale = generateScale({ h: 210, s: 100, l: 50 });
    expect(scale.root.primary).toBe("210 100% 50%");
  });

  it("root and dark have matching key counts", () => {
    const scale = generateScale({ h: 210, s: 81, l: 56 });
    expect(Object.keys(scale.root).length).toBe(Object.keys(scale.dark).length);
  });

  it("foreground is darker than background in root", () => {
    const scale = generateScale({ h: 210, s: 81, l: 56 });
    const bgL = Number.parseInt(scale.root.background.split(" ")[2]);
    const fgL = Number.parseInt(scale.root.foreground.split(" ")[2]);
    expect(fgL).toBeLessThan(bgL);
  });

  it("foreground is lighter than background in dark", () => {
    const scale = generateScale({ h: 210, s: 81, l: 56 });
    const bgL = Number.parseInt(scale.dark.background.split(" ")[2]);
    const fgL = Number.parseInt(scale.dark.foreground.split(" ")[2]);
    expect(fgL).toBeGreaterThan(bgL);
  });
});
