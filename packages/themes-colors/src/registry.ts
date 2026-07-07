import type { ThemeRegistry } from "./types";
import defaultTheme from "../themes/default.json";
import freshlimeTheme from "../themes/freshlime.json";
import coffeeTheme from "../themes/coffee.json";
import defaultSyntax from "../syntax/default-syntax.json";
import freshlimeSyntax from "../syntax/freshlime-syntax.json";
import coffeeSyntax from "../syntax/coffee-syntax.json";

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
