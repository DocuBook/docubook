import { describe, it, expect, vi, afterEach } from "vitest";
import { resolveTheme } from "../resolve.js";
import { defaultTheme, mockRegistry } from "../__fixtures__/themes.js";
import type { ThemeRegistry } from "../types.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("resolveTheme — string preset", () => {
  it("returns default theme for 'default' preset", () => {
    const result = resolveTheme("default", mockRegistry);
    expect(result).toEqual(defaultTheme);
  });

  it("returns freshlime theme for 'freshlime' preset", () => {
    const result = resolveTheme("freshlime", mockRegistry);
    expect(result).toBe(mockRegistry.freshlime);
  });

  it("returns exact default variables (24 root + 24 dark keys)", () => {
    const result = resolveTheme("default", mockRegistry);
    expect(Object.keys(result.variables.root)).toHaveLength(24);
    expect(Object.keys(result.variables.dark)).toHaveLength(24);
    expect(result.variables.root.primary).toBe("210 81% 56%");
    expect(result.variables.root.ring).toBe("210 81% 56%");
    expect(result.variables.root.radius).toBe("0.5rem");
    expect(result.variables.root["base-100"]).toBe("100% 0 0");
    expect(result.variables.dark["base-content"]).toBe("95% 0.01 260");
  });
});

describe("resolveTheme — custom hex config", () => {
  it("generates palette from primary hex with #", () => {
    const result = resolveTheme({ primary: "#3B82F6" }, mockRegistry);
    expect(result.variables.root.primary).toBe("217 91% 60%");
    expect(result.variables.root.ring).toBe("217 91% 60%");
    expect(result.variables.root.radius).toBe("0.5rem");
    expect(Object.keys(result.variables.root).length).toBe(24);
    expect(Object.keys(result.variables.dark).length).toBe(24);
    // Destructive stays red
    expect(result.variables.root.destructive).toBe("0 85% 60%");
  });

  it("generates palette from primary hex without #", () => {
    const result = resolveTheme({ primary: "3B82F6" }, mockRegistry);
    expect(result.variables.root.primary).toBe("217 91% 60%");
  });

  it("generates palette from red hex", () => {
    const result = resolveTheme({ primary: "#FF0000" }, mockRegistry);
    expect(result.variables.root.primary).toBe("0 100% 50%");
  });

  it("generates palette from green hex", () => {
    const result = resolveTheme({ primary: "#00FF00" }, mockRegistry);
    expect(result.variables.root.primary).toBe("120 100% 50%");
  });

  it("generates palette from white hex", () => {
    const result = resolveTheme({ primary: "#FFFFFF" }, mockRegistry);
    expect(result.variables.root.primary).toBe("0 0% 100%");
  });

  it("generates syntax highlighting for custom themes", () => {
    const result = resolveTheme({ primary: "#3B82F6" }, mockRegistry);
    expect(result.syntax.light.keyword).toBeDefined();
    expect(result.syntax.dark.keyword).toBeDefined();
    expect(result.syntax.light.string).toBeDefined();
    expect(result.syntax.dark.string).toBeDefined();
    expect(Object.keys(result.syntax.light).length).toBe(12);
    expect(Object.keys(result.syntax.dark).length).toBe(12);
  });
});

describe("resolveTheme — fallback scenarios", () => {
  it("falls back to default for undefined config", () => {
    const result = resolveTheme(undefined, mockRegistry);
    expect(result).toEqual(defaultTheme);
  });

  it("falls back to default for null config", () => {
    const result = resolveTheme(null, mockRegistry);
    expect(result).toEqual(defaultTheme);
  });

  it("falls back to default for unknown preset", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = resolveTheme("unknown", mockRegistry);
    expect(result).toEqual(defaultTheme);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Unknown theme preset"));
  });

  it("falls back to default for invalid hex", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = resolveTheme({ primary: "#GGG" }, mockRegistry);
    expect(result).toEqual(defaultTheme);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Invalid hex color"),
      expect.any(Error)
    );
  });

  it("falls back to default for empty object config", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = resolveTheme({} as { primary: string }, mockRegistry);
    expect(result).toEqual(defaultTheme);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Invalid theme config"));
  });

  it("falls back to default for number config", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = resolveTheme(42 as unknown as string, mockRegistry);
    expect(result).toEqual(defaultTheme);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Invalid theme config"));
  });

  it("falls back to empty theme when registry has no default", () => {
    const emptyRegistry: ThemeRegistry = {};
    const result = resolveTheme(undefined, emptyRegistry);
    expect(result.variables).toEqual({ root: {}, dark: {} });
    expect(result.syntax).toEqual({ light: {}, dark: {} });
  });

  it("falls back to empty theme for unknown preset when registry has no default", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const emptyRegistry: ThemeRegistry = {};
    const result = resolveTheme("foo", emptyRegistry);
    expect(warnSpy).toHaveBeenCalled();
    expect(result.variables).toEqual({ root: {}, dark: {} });
  });
});

describe("resolveTheme — edge cases", () => {
  it("handles empty string preset like missing config (no warning)", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = resolveTheme("", mockRegistry);
    expect(result).toEqual(defaultTheme);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("handles very short hex #fff", () => {
    const result = resolveTheme({ primary: "#fff" }, mockRegistry);
    expect(result.variables.root.primary).toBe("0 0% 100%");
    expect(Object.keys(result.variables.root).length).toBe(24);
  });

  it("falls back to empty theme for invalid hex when no default exists", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const emptyRegistry: ThemeRegistry = {};
    const result = resolveTheme({ primary: "#GGG" }, emptyRegistry);
    expect(warnSpy).toHaveBeenCalled();
    expect(result.variables).toEqual({ root: {}, dark: {} });
  });

  it("falls back to empty theme for invalid shape when no default exists", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const emptyRegistry: ThemeRegistry = {};
    const result = resolveTheme(42 as unknown as string, emptyRegistry);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Invalid theme config"));
    expect(result.variables).toEqual({ root: {}, dark: {} });
  });
});
