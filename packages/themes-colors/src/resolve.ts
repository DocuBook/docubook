import type { ResolvedTheme, ThemeConfig, ThemeData, ThemeRegistry } from "./types";
import { hexToHsl, generateScale, generateSyntaxScale } from "./hex-to-hsl";

/**
 * Default empty syntax tokens used as fallback.
 */
const EMPTY_SYNTAX = { light: {}, dark: {} };

/**
 * Resolve a user-facing theme config into a fully expanded ResolvedTheme.
 *
 * - If `config` is a string, it is treated as a preset name and looked up in the registry.
 * - If `config` is an object with `primary`, the hex value is converted to HSL
 *   and a full palette is auto-generated via `generateScale`.
 * - If `config` is missing, null, or invalid, the registry's "default" is used as fallback.
 *
 * @param config - Theme configuration from docu.json
 * @param registry - Theme registry containing preset data
 * @returns Fully resolved theme with variables and syntax tokens
 */
export function resolveTheme(
  config: ThemeConfig | undefined | null,
  registry: ThemeRegistry
): ResolvedTheme {
  // Fallback to default when config is missing
  if (!config) {
    return registry.default || { variables: { root: {}, dark: {} }, syntax: EMPTY_SYNTAX };
  }

  // Preset name lookup
  if (typeof config === "string") {
    const preset = registry[config];
    if (preset) {
      return preset;
    }
    console.warn(`[themes-colors] Unknown theme preset "${config}". Falling back to "default".`);
    return registry.default || { variables: { root: {}, dark: {} }, syntax: EMPTY_SYNTAX };
  }

  // Custom hex config
  if (typeof config === "object" && config.primary) {
    try {
      const hsl = hexToHsl(config.primary);
      const scale = generateScale(hsl);
      const variables: ThemeData = { root: scale.root, dark: scale.dark };
      const syntax = generateSyntaxScale(hsl);

      return {
        variables,
        syntax,
      };
    } catch (err) {
      console.warn(
        `[themes-colors] Invalid hex color "${config.primary}". Falling back to "default".`,
        err
      );
      return registry.default || { variables: { root: {}, dark: {} }, syntax: EMPTY_SYNTAX };
    }
  }

  // Invalid config shape
  console.warn(`[themes-colors] Invalid theme config. Falling back to "default".`);
  return registry.default || { variables: { root: {}, dark: {} }, syntax: EMPTY_SYNTAX };
}
