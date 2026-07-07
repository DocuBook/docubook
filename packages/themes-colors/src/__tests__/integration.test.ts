import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveTheme, generateThemeCss } from "../index.js";
import type { ThemeRegistry } from "../types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const themesDir = resolve(__dirname, "../../themes");
const syntaxDir = resolve(__dirname, "../../syntax");

function loadJson(file: string) {
  return JSON.parse(readFileSync(file, "utf-8"));
}

const registry: ThemeRegistry = {
  default: {
    variables: loadJson(resolve(themesDir, "default.json")),
    syntax: loadJson(resolve(syntaxDir, "default-syntax.json")),
  },
  freshlime: {
    variables: loadJson(resolve(themesDir, "freshlime.json")),
    syntax: loadJson(resolve(syntaxDir, "freshlime-syntax.json")),
  },
  coffee: {
    variables: loadJson(resolve(themesDir, "coffee.json")),
    syntax: loadJson(resolve(syntaxDir, "coffee-syntax.json")),
  },
};

describe("integration — full pipeline", () => {
  it("resolves default preset and generates CSS", () => {
    const resolved = resolveTheme("default", registry);
    const css = generateThemeCss(resolved);

    expect(css).toContain("@layer base");
    expect(css).toContain("--background: 210 40% 98%;");
    expect(css).toContain("--primary: 210 81% 56%;");
    expect(css).toContain("--radius: 0.5rem;");
    expect(css).toContain("--base-100: 100% 0 0;");

    // Dark mode
    expect(css).toContain("--background: 225 20% 11%;");
    expect(css).toContain("--primary: 210 100% 67%;");

    // Syntax highlighting
    expect(css).toContain(".keyword {");
    expect(css).toContain("color: #1d4ed8;");
    expect(css).toContain(".dark .keyword {");
    expect(css).toContain("color: #60a5fa;");
  });

  it("resolves freshlime preset and generates CSS", () => {
    const resolved = resolveTheme("freshlime", registry);
    const css = generateThemeCss(resolved);

    expect(css).toContain("@layer base");
    expect(css).toContain("--background: 85 45% 98%;");
    expect(css).toContain("--primary: 85 70% 45%;");
    expect(css).toContain("--base-100: 100% 0 0;");

    expect(css).toContain("--background: 85 20% 8%;");
    expect(css).toContain("--primary: 85 75% 55%;");

    // Freshlime syntax uses hsl() format
    expect(css).toContain(".keyword {");
    expect(css).toContain("color: hsl(85 70% 30%);");
  });

  it("resolves coffee preset and generates CSS", () => {
    const resolved = resolveTheme("coffee", registry);
    const css = generateThemeCss(resolved);

    expect(css).toContain("@layer base");
    expect(css).toContain("--background: 35 40% 96%;");
    expect(css).toContain("--primary: 25 60% 40%;");

    expect(css).toContain("--background: 30 10% 6%;");
    expect(css).toContain("--primary: 30 45% 52%;");

    // Coffee syntax uses hsl() format
    expect(css).toContain(".keyword {");
    expect(css).toContain("color: hsl(25 60% 35%);");
  });
});

describe("integration — custom hex to full CSS", () => {
  it("generates complete CSS from hex primary", () => {
    const resolved = resolveTheme({ primary: "#FF0000" }, registry);
    const css = generateThemeCss(resolved);

    expect(css).toContain("@layer base");
    expect(css).toContain(":root {");
    expect(css).toContain(".dark {");
    expect(css).toContain("--primary: 0 100% 50%;");
    expect(css).toContain("--radius: 0.5rem;");
    expect(css).toContain("--base-100: 100% 0 0;");

    // Destructive stays red-based
    expect(css).toContain("--destructive: 0 85% 60%;");

    // Custom themes get derived syntax highlighting
    expect(css).toContain(".keyword {");
    expect(css).toContain(".dark .keyword {");
  });

  it("generates CSS from green hex", () => {
    const resolved = resolveTheme({ primary: "#00FF00" }, registry);
    const css = generateThemeCss(resolved);
    expect(css).toContain("--primary: 120 100% 50%;");
  });
});

describe("integration — CSS structure validation", () => {
  it(":root block has exactly 24 variables for default", () => {
    const resolved = resolveTheme("default", registry);
    const css = generateThemeCss(resolved);
    const rootMatch = css.match(/:root\s*\{([^}]+)\}/);
    expect(rootMatch).not.toBeNull();
    const decls = rootMatch![1].split(";").filter((s) => s.trim());
    expect(decls.length).toBe(24);
  });

  it(".dark block has exactly 24 variables for freshlime", () => {
    const resolved = resolveTheme("freshlime", registry);
    const css = generateThemeCss(resolved);
    const darkMatch = css.match(/\.dark\s*\{([^}]+)\}/);
    expect(darkMatch).not.toBeNull();
    const decls = darkMatch![1].split(";").filter((s) => s.trim());
    expect(decls.length).toBe(24);
  });

  it("root and dark have matching variable count for coffee", () => {
    const resolved = resolveTheme("coffee", registry);
    const css = generateThemeCss(resolved);

    const rootMatch = css.match(/:root\s*\{([^}]+)\}/);
    const darkMatch = css.match(/\.dark\s*\{([^}]+)\}/);
    expect(rootMatch).not.toBeNull();
    expect(darkMatch).not.toBeNull();

    const rootCount = rootMatch![1].split(";").filter((s) => s.trim()).length;
    const darkCount = darkMatch![1].split(";").filter((s) => s.trim()).length;
    expect(rootCount).toBe(darkCount);
  });

  it("all themes produce same number of CSS variables per mode", () => {
    for (const name of ["default", "freshlime", "coffee"]) {
      const resolved = resolveTheme(name, registry);
      const css = generateThemeCss(resolved);

      const rootMatch = css.match(/:root\s*\{([^}]+)\}/);
      const darkMatch = css.match(/\.dark\s*\{([^}]+)\}/);
      expect(rootMatch).not.toBeNull();
      expect(darkMatch).not.toBeNull();

      const rootCount = rootMatch![1].split(";").filter((s) => s.trim()).length;
      const darkCount = darkMatch![1].split(";").filter((s) => s.trim()).length;
      expect(rootCount).toBe(24);
      expect(darkCount).toBe(24);
    }
  });

  it("CSS is parseable (balanced braces)", () => {
    for (const name of ["default", "freshlime", "coffee"]) {
      const resolved = resolveTheme(name, registry);
      const css = generateThemeCss(resolved);

      let open = 0;
      for (const ch of css) {
        if (ch === "{") open++;
        if (ch === "}") open--;
        expect(open).toBeGreaterThanOrEqual(0);
      }
      expect(open).toBe(0);
    }
  });

  it("all kebab-case variable names use double-dash prefix", () => {
    for (const name of ["default", "freshlime", "coffee"]) {
      const resolved = resolveTheme(name, registry);
      const css = generateThemeCss(resolved);
      const varLines = css.match(/--[\w-]+:/g) || [];
      expect(varLines.length).toBeGreaterThan(0);
      expect(varLines.every((v) => v.startsWith("--"))).toBe(true);
    }
  });
});

describe("integration — custom hex edge cases", () => {
  it("generates CSS from #fff shorthand", () => {
    const resolved = resolveTheme({ primary: "#fff" }, registry);
    const css = generateThemeCss(resolved);
    expect(css).toContain("--primary: 0 0% 100%;");
  });

  it("generates CSS from #000 black", () => {
    const resolved = resolveTheme({ primary: "#000" }, registry);
    const css = generateThemeCss(resolved);
    expect(css).toContain("--primary: 0 0% 0%;");
  });

  it("generates CSS with 24 vars from custom hex", () => {
    const resolved = resolveTheme({ primary: "#3B82F6" }, registry);
    const css = generateThemeCss(resolved);
    const rootMatch = css.match(/:root\s*\{([^}]+)\}/);
    expect(rootMatch).not.toBeNull();
    const decls = rootMatch![1].split(";").filter((s) => s.trim());
    expect(decls.length).toBe(24);
  });
});
