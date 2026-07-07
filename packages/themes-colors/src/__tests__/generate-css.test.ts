import { describe, it, expect } from "vitest";
import { generateThemeCss, generateSyntaxCss } from "../generate-css";
import { minimalTheme, emptySyntaxTheme, defaultTheme } from "../__fixtures__/themes";

describe("generateThemeCss", () => {
  it("starts with @layer base", () => {
    const css = generateThemeCss(minimalTheme);
    expect(css).toMatch(/^@layer base/);
  });

  it("contains :root block with CSS variables", () => {
    const css = generateThemeCss(minimalTheme);
    expect(css).toContain(":root {");
    expect(css).toContain("--background: 210 40% 98%;");
    expect(css).toContain("--primary: 210 81% 56%;");
  });

  it("contains .dark block with CSS variables", () => {
    const css = generateThemeCss(minimalTheme);
    expect(css).toContain(".dark {");
    expect(css).toContain("--background: 225 20% 11%;");
    expect(css).toContain("--primary: 210 100% 67%;");
  });

  it("contains syntax highlighting in output", () => {
    const css = generateThemeCss(minimalTheme);
    expect(css).toContain(".keyword {");
    expect(css).toContain("color: #1d4ed8;");
    expect(css).toContain(".dark .keyword {");
    expect(css).toContain("color: #60a5fa;");
  });

  it("includes camelCase-to-kebab conversion for attr-value", () => {
    const css = generateThemeCss(minimalTheme);
    expect(css).toContain(".attr-value {");
    expect(css).toContain("color: #2563eb;");
  });

  it("uses double newline separator between base and syntax", () => {
    const css = generateThemeCss(minimalTheme);
    const blocks = css.split("\n\n");
    expect(blocks.length).toBeGreaterThanOrEqual(2);
    expect(blocks[0]).toContain("@layer base");
  });

  it("only outputs @layer base when no syntax provided", () => {
    const css = generateThemeCss(emptySyntaxTheme);
    expect(css).toContain("@layer base");
    expect(css).not.toContain(".keyword");
    expect(css).not.toContain(".function");
  });

  it("formats HSL values in correct format", () => {
    const css = generateThemeCss(minimalTheme);
    const hslPattern = /--[\w-]+:\s+\d+\s+\d+%\s+\d+%/;
    expect(css).toMatch(hslPattern);
  });

  it("includes daisyUI tokens (base-100 etc)", () => {
    const css = generateThemeCss(minimalTheme);
    expect(css).toContain("--base-100: 100% 0 0;");
    expect(css).toContain("--base-100: 22% 0.02 260;");
  });

  it("includes radius token", () => {
    const css = generateThemeCss(minimalTheme);
    expect(css).toContain("--radius: 0.5rem;");
  });
});

describe("generateThemeCss — full default theme", () => {
  it("generates all 24 root variables", () => {
    const css = generateThemeCss(defaultTheme);
    const rootMatch = css.match(/:root\s*\{([^}]+)\}/);
    expect(rootMatch).not.toBeNull();
    const vars = rootMatch![1];
    const declarations = vars.split(";").filter((s) => s.trim());
    expect(declarations.length).toBe(24);
  });

  it("generates all 24 dark variables", () => {
    const css = generateThemeCss(defaultTheme);
    const darkMatch = css.match(/\.dark\s*\{([^}]+)\}/);
    expect(darkMatch).not.toBeNull();
    const vars = darkMatch![1];
    const declarations = vars.split(";").filter((s) => s.trim());
    expect(declarations.length).toBe(24);
  });

  it("root and dark sections have matching key counts", () => {
    const css = generateThemeCss(defaultTheme);
    const rootVars = css.match(/:root\s*\{([^}]+)\}/)![1];
    const darkVars = css.match(/\.dark\s*\{([^}]+)\}/)![1];
    const rootKeys = rootVars.split(";").filter((s) => s.trim()).length;
    const darkKeys = darkVars.split(";").filter((s) => s.trim()).length;
    expect(rootKeys).toBe(darkKeys);
  });

  it("contains kebab-case keys from camelCase in data", () => {
    const css = generateThemeCss(defaultTheme);
    expect(css).toContain("--card-foreground:");
    expect(css).toContain("--primary-foreground:");
    expect(css).toContain("--secondary-foreground:");
    expect(css).toContain("--muted-foreground:");
    expect(css).toContain("--accent-foreground:");
    expect(css).toContain("--destructive-foreground:");
    expect(css).toContain("--base-content:");
  });

  it("outputs light mode syntax tokens without .dark prefix", () => {
    const css = generateThemeCss(defaultTheme);
    expect(css).toMatch(/^.keyword \{/m);
    expect(css).toMatch(/^.function \{/m);
    expect(css).toMatch(/^.string \{/m);
  });

  it("outputs 12 syntax tokens for dark mode with .dark prefix", () => {
    const css = generateThemeCss(defaultTheme);
    const darkKeywordCount = (css.match(/\.dark \.keyword\s*\{/g) || []).length;
    expect(darkKeywordCount).toBe(1);
  });
});

describe("generateSyntaxCss", () => {
  it("generates light mode selectors", () => {
    const css = generateSyntaxCss({
      light: { keyword: "#1d4ed8", function: "#0369a1" },
      dark: {},
    });
    expect(css).toContain(".keyword {");
    expect(css).toContain("  color: #1d4ed8;");
    expect(css).toContain(".function {");
    expect(css).toContain("  color: #0369a1;");
  });

  it("generates dark mode selectors with .dark prefix", () => {
    const css = generateSyntaxCss({
      light: { keyword: "#1d4ed8" },
      dark: { keyword: "#60a5fa" },
    });
    expect(css).toContain(".dark .keyword {");
    expect(css).toContain("  color: #60a5fa;");
  });

  it("generates only light when dark is empty", () => {
    const css = generateSyntaxCss({
      light: { keyword: "#1d4ed8" },
      dark: {},
    });
    expect(css).toContain(".keyword");
    expect(css).not.toContain(".dark .keyword");
  });

  it("generates only dark when light is empty", () => {
    const css = generateSyntaxCss({
      light: {},
      dark: { keyword: "#60a5fa" },
    });
    expect(css).not.toContain("\n\n"); // no separator needed
  });

  it("returns empty string when both modes are empty", () => {
    const css = generateSyntaxCss({ light: {}, dark: {} });
    expect(css).toBe("");
  });

  it("converts camelCase attrName to .attr-name selector", () => {
    const css = generateSyntaxCss({
      light: { attrName: "#0284c7" },
      dark: {},
    });
    expect(css).toContain(".attr-name");
    expect(css).not.toContain(".attrName");
  });

  it("converts camelCase attrValue to .attr-value selector", () => {
    const css = generateSyntaxCss({
      light: { attrValue: "#2563eb" },
      dark: {},
    });
    expect(css).toContain(".attr-value");
  });

  it("accepts a custom prefix parameter", () => {
    const css = generateSyntaxCss({ light: { keyword: "#1d4ed8" }, dark: {} }, ".code-block ");
    expect(css).toContain(".code-block .keyword {");
  });

  it("includes prefix in dark mode selectors", () => {
    const css = generateSyntaxCss(
      { light: { keyword: "#1d4ed8" }, dark: { keyword: "#60a5fa" } },
      ".code-block "
    );
    expect(css).toContain(".code-block .dark .keyword {");
  });

  it("handles multiple tokens", () => {
    const css = generateSyntaxCss({
      light: {
        keyword: "#1d4ed8",
        function: "#0369a1",
        punctuation: "#4b5563",
        comment: "#6b7280",
        string: "#0d9488",
        constant: "#0d9488",
        annotation: "#0d9488",
        boolean: "#0d9488",
        number: "#0d9488",
        tag: "#1d4ed8",
        attrName: "#0284c7",
        attrValue: "#2563eb",
      },
      dark: {
        keyword: "#60a5fa",
        function: "#38bdf8",
        punctuation: "#9ca3af",
        comment: "#9ca3af",
        string: "#2dd4bf",
        constant: "#2dd4bf",
        annotation: "#2dd4bf",
        boolean: "#2dd4bf",
        number: "#2dd4bf",
        tag: "#60a5fa",
        attrName: "#7dd3fc",
        attrValue: "#3b82f6",
      },
    });
    const lines = css.split("\n").filter((l) => l.trim());
    expect(lines.length).toBeGreaterThan(20); // many selectors
  });
});

describe("generateThemeCss — edge cases", () => {
  it("handles empty variables root", () => {
    const css = generateThemeCss({
      variables: { root: {}, dark: {} },
      syntax: { light: {}, dark: {} },
    });
    expect(css).toContain("@layer base");
    expect(css).toContain(":root {");
    expect(css).toContain("  }");
  });

  it("handles single variable", () => {
    const css = generateThemeCss({
      variables: { root: { test: "123" }, dark: { test: "456" } },
      syntax: { light: {}, dark: {} },
    });
    expect(css).toContain("--test: 123;");
    expect(css).toContain("--test: 456;");
  });

  it("includes trailing newline in each block", () => {
    const css = generateThemeCss(minimalTheme);
    // :root block should close properly
    expect(css).toMatch(/ {2}\}\n/);
  });
});
