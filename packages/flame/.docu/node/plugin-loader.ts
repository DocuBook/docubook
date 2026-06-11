import { resolve } from "node:path";
import { PROJECT_ROOT } from "./paths";
import type { DocuBookPlugin, PluginEntry } from "./plugin";

/**
 * Resolve a plugin specifier to an absolute path or npm package name.
 *
 * Resolution rules:
 * 1. Relative path (starts with `.`) → resolve from project root, guard traversal
 * 2. Absolute path (starts with `/`) → guard traversal
 * 3. Anything else → treat as npm package name (handled by Bun's import)
 *
 * Path traversal protection:
 * - All file-system paths (relative & absolute) must resolve within PROJECT_ROOT.
 * - This prevents `../../sensitive-file` or `/etc/passwd` from being imported.
 */
/** @internal Exported for testing only. */
export function resolveSpecifier(specifier: string): string {
  let resolved: string;

  if (specifier.startsWith(".")) {
    // Relative path → resolve from project root
    resolved = resolve(PROJECT_ROOT, specifier);
  } else if (specifier.startsWith("/")) {
    // Absolute path → use as-is
    resolved = specifier;
  } else {
    // npm package name → handled by Bun's import
    return specifier;
  }

  // Path traversal guard: resolved path must stay within PROJECT_ROOT
  const root = PROJECT_ROOT.endsWith("/") ? PROJECT_ROOT : PROJECT_ROOT + "/";
  if (!resolved.startsWith(root)) {
    throw new Error(
      `[plugin-loader] Path traversal blocked: "${specifier}" resolves outside project root`
    );
  }

  return resolved;
}

/**
 * Load and instantiate all plugins from a config entries array.
 *
 * @param entries - Array of plugin entries from `docu.json`.
 *   Each entry is either:
 *   - a `string` (plugin specifier, no options)
 *   - a `[string, object]` tuple (plugin specifier + factory options)
 * @returns Array of resolved `DocuBookPlugin` instances.
 *
 * @throws If a plugin specifier cannot be imported.
 * @throws If a plugin's default export lacks a `name` property.
 *
 * @example
 * const plugins = await loadPlugins([
 *   "@docubook/plugin-sitemap",
 *   ["@docubook/plugin-analytics", { id: "G-XXXXXXX" }],
 *   "./plugins/local-reading-time",
 * ]);
 */
export async function loadPlugins(entries: PluginEntry[] = []): Promise<DocuBookPlugin[]> {
  const plugins: DocuBookPlugin[] = [];

  for (const entry of entries) {
    const [specifier, options] = Array.isArray(entry) ? entry : [entry, undefined];
    const resolved = resolveSpecifier(specifier);

    let mod: Record<string, unknown>;
    try {
      mod = await import(resolved);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`[plugin-loader] Failed to import plugin "${specifier}": ${message}`, {
        cause: err,
      });
    }

    const exported = mod.default as unknown;

    let plugin: DocuBookPlugin;

    if (typeof exported === "function") {
      // Factory pattern: exported function receives options, returns DocuBookPlugin
      try {
        plugin = (exported as (opts?: Record<string, unknown>) => DocuBookPlugin)(options);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(
          `[plugin-loader] Plugin factory "${specifier}" threw during initialization: ${message}`,
          { cause: err }
        );
      }
    } else if (exported && typeof exported === "object") {
      // Simple pattern: exported object is (or duck-types as) DocuBookPlugin
      plugin = exported as DocuBookPlugin;
    } else {
      throw new Error(
        `[plugin-loader] Plugin "${specifier}" must export a default function or object. Got: ${typeof exported}`
      );
    }

    if (!plugin.name || typeof plugin.name !== "string") {
      throw new Error(
        `[plugin-loader] Plugin "${specifier}" must have a valid 'name' property (string). Got: ${typeof plugin.name}`
      );
    }

    if (typeof plugin.setup !== "function") {
      throw new Error(
        `[plugin-loader] Plugin "${specifier}" (name: "${plugin.name}") must have a 'setup(build)' function.`
      );
    }

    plugins.push(plugin);
  }

  return plugins;
}
