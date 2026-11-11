import { resolveTheme } from "@docubook/themes-colors";

// Every variable is a color except the radius: the base-* ones are oklch triplets, the rest hsl.
const swatches = (mode: Record<string, string>) =>
  Object.entries(mode)
    .filter(([key]) => key !== "radius")
    .map(([key, value]) => ({
      name: `--${key}`,
      color: key.startsWith("base-") ? `oklch(${value})` : `hsl(${value})`,
    }));

/**
 * The palette Flame generates from one primary hex: what `"colors": { "primary": hex }` in docu.json resolves to.
 * The themes page calls it at build time for its first frame and again in the browser when the color is changed,
 * so both go through the package's own resolver. The empty registry is enough: a hex never needs a preset.
 */
export function palette(primary: string) {
  const { variables, syntax } = resolveTheme({ primary }, {});
  return {
    variables: Object.keys(variables.root).length,
    light: swatches(variables.root),
    dark: swatches(variables.dark),
    syntax: Object.entries(syntax.dark).map(([name, color]) => ({ name, color })),
  };
}
