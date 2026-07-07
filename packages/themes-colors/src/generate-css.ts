import type { ResolvedTheme, SyntaxTokens, ThemeData } from "./types.js";

/**
 * Generate a CSS string from resolved theme variables.
 *
 * Output includes:
 * - `@layer base { :root { ... } .dark { ... } }` for theme CSS variables
 * - Syntax highlighting token colors (light + dark mode)
 *
 * @param theme - Resolved theme data from `resolveTheme()`
 * @returns Complete CSS string ready for injection
 */
export function generateThemeCss(theme: ResolvedTheme): string {
  const parts: string[] = [];

  // Base layer with theme variables
  parts.push(`@layer base {\n${generateVariables(theme.variables)}\n}`);

  // Syntax highlighting
  const syntaxCss = generateSyntaxCss(theme.syntax);
  if (syntaxCss) {
    parts.push(syntaxCss);
  }

  return parts.join("\n\n");
}

/**
 * Generate CSS variable declarations for :root and .dark.
 */
function generateVariables(variables: ThemeData): string {
  const parts: string[] = [];

  // :root block
  parts.push("  :root {");
  for (const [key, value] of Object.entries(variables.root)) {
    parts.push(`    --${key}: ${value};`);
  }
  parts.push("  }");

  // .dark block
  parts.push("");
  parts.push("  .dark {");
  for (const [key, value] of Object.entries(variables.dark)) {
    parts.push(`    --${key}: ${value};`);
  }
  parts.push("  }");

  return parts.join("\n");
}

/**
 * Generate CSS for syntax highlighting tokens.
 *
 * Output uses class selectors like `.keyword`, `.function`, etc.
 * with `.dark` prefix for dark mode.
 *
 * @param syntax - Syntax highlighting tokens
 * @param prefix - Optional CSS selector prefix (default: "")
 * @returns CSS string, empty if no syntax tokens provided
 */
export function generateSyntaxCss(syntax: SyntaxTokens, prefix: string = ""): string {
  const parts: string[] = [];
  const { light, dark } = syntax;

  if (Object.keys(light).length === 0 && Object.keys(dark).length === 0) {
    return "";
  }

  // Light mode
  if (Object.keys(light).length > 0) {
    for (const [token, color] of Object.entries(light)) {
      const selector = toTokenSelector(token);
      parts.push(`${prefix}${selector} {`);
      parts.push(`  color: ${color};`);
      parts.push("}");
    }
  }

  // Dark mode
  if (Object.keys(dark).length > 0) {
    if (Object.keys(light).length > 0) parts.push("");

    for (const [token, color] of Object.entries(dark)) {
      const selector = toTokenSelector(token);
      parts.push(`${prefix}.dark ${selector} {`);
      parts.push(`  color: ${color};`);
      parts.push("}");
    }
  }

  return parts.join("\n");
}

/**
 * Convert a camelCase token name like "attrName" to CSS selector ".attr-name".
 */
function toTokenSelector(token: string): string {
  const kebab = token
    .replace(/([A-Z])/g, "-$1")
    .toLowerCase()
    .replace(/^-/, "");
  return `.${kebab}`;
}
