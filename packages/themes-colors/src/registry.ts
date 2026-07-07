import type { ThemeRegistry } from "./types.js";
import defaultTheme from "../themes/default.json" with { type: "json" };
import freshlimeTheme from "../themes/freshlime.json" with { type: "json" };
import coffeeTheme from "../themes/coffee.json" with { type: "json" };
import defaultSyntax from "../syntax/default-syntax.json" with { type: "json" };
import freshlimeSyntax from "../syntax/freshlime-syntax.json" with { type: "json" };
import coffeeSyntax from "../syntax/coffee-syntax.json" with { type: "json" };

/**
 * Pre-built registry of all preset themes with their syntax data.
 *
 * Provides the `ThemeRegistry` expected by `resolveTheme()`.
 * Import this instead of manually constructing a registry from individual JSON files.
 */
export const presetRegistry: ThemeRegistry = {
  default: { variables: defaultTheme, syntax: defaultSyntax },
  freshlime: { variables: freshlimeTheme, syntax: freshlimeSyntax },
  coffee: { variables: coffeeTheme, syntax: coffeeSyntax },
};
