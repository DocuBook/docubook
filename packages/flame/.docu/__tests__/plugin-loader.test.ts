import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { loadPlugins, resolveSpecifier } from "../node/plugin-loader";

// ─── Fixtures path helper ────────────────────────────────

const FIXTURES = "./.docu/__tests__/fixtures";

function fixture(file: string) {
  return `${FIXTURES}/${file}.ts`;
}

const SIMPLE = fixture("simple-plugin");
const FACTORY = fixture("factory-plugin");
const INVALID_STRING = fixture("invalid-string");
const MISSING_NAME = fixture("missing-name");
const MISSING_SETUP = fixture("missing-setup");

// ─── resolveSpecifier ───────────────────────────────────

describe("resolveSpecifier", () => {
  const ROOT = process.cwd();

  it("resolves relative paths from project root", () => {
    expect(resolveSpecifier("./plugins/my-plugin.ts")).toBe(
      resolve(ROOT, "./plugins/my-plugin.ts")
    );
  });

  it("blocks absolute paths outside project root", () => {
    expect(() => resolveSpecifier("/usr/lib/plugin.mjs")).toThrow(
      "[plugin-loader] Path traversal blocked"
    );
  });

  it("keeps npm package names unchanged", () => {
    expect(resolveSpecifier("@docubook/plugin-sitemap")).toBe("@docubook/plugin-sitemap");
  });

  it("blocks parent-relative paths escaping project root", () => {
    expect(() => resolveSpecifier("../other-pkg/plugin.mjs")).toThrow(
      "[plugin-loader] Path traversal blocked"
    );
  });

  it("rejects npm specifier with uppercase letters", () => {
    expect(() => resolveSpecifier("@DocuBook/Plugin-Sitemap")).toThrow(
      "[plugin-loader] Invalid plugin specifier"
    );
  });

  it("rejects npm specifier with spaces", () => {
    expect(() => resolveSpecifier("my plugin")).toThrow("[plugin-loader] Invalid plugin specifier");
  });

  it("rejects npm specifier with special characters", () => {
    expect(() => resolveSpecifier("plugin<script>")).toThrow(
      "[plugin-loader] Invalid plugin specifier"
    );
  });

  it("rejects npm specifier starting with dot but missing path", () => {
    // resolveSpecifier sees "." as relative → resolves, but file won't exist
    // This is fine — the npm validation only runs for non-path specifiers
    expect(() => resolveSpecifier(".")).not.toThrow("[plugin-loader] Invalid plugin specifier");
  });

  it("accepts valid scoped npm package", () => {
    expect(resolveSpecifier("@docubook/plugin-sitemap")).toBe("@docubook/plugin-sitemap");
  });

  it("accepts valid unscoped npm package", () => {
    expect(resolveSpecifier("docubook-plugin-reading-time")).toBe("docubook-plugin-reading-time");
  });

  it("accepts npm package with dots in name", () => {
    expect(resolveSpecifier("@scope/plugin.v2")).toBe("@scope/plugin.v2");
  });

  it("accepts npm package with tildes in name", () => {
    expect(resolveSpecifier("@scope/~plugin")).toBe("@scope/~plugin");
  });
});

// ─── loadPlugins — edge cases ───────────────────────────

describe("loadPlugins — edge cases", () => {
  it("returns empty array for undefined entries", async () => {
    expect(await loadPlugins(undefined)).toEqual([]);
  });

  it("returns empty array for empty entries", async () => {
    expect(await loadPlugins([])).toEqual([]);
  });

  it("throws on unresolvable import path", async () => {
    await expect(loadPlugins(["./non-existent-plugin-that-does-not-exist.mjs"])).rejects.toThrow(
      "[plugin-loader] Failed to import plugin"
    );
  });

  it("throws on non-existent npm package", async () => {
    await expect(loadPlugins(["@docubook/non-existent-plugin-xyz-123"])).rejects.toThrow(
      "[plugin-loader] Failed to import plugin"
    );
  });

  it("throws when default export is a string", async () => {
    await expect(loadPlugins([INVALID_STRING])).rejects.toThrow(
      "must export a default function or object"
    );
  });
});

// ─── loadPlugins — simple object pattern ─────────────────

describe("loadPlugins — simple object pattern", () => {
  /** Load the simple-plugin fixture and verify its identity. */
  async function assertSimple(file: string) {
    const plugins = await loadPlugins([file]);
    expect(plugins).toHaveLength(1);
    expect(plugins[0].name).toBe("fixture-simple");
    expect(typeof plugins[0].setup).toBe("function");
  }

  it("loads from relative path", () => assertSimple(SIMPLE));

  it("loads from absolute path", async () => {
    const abs = resolve(process.cwd(), SIMPLE);
    await assertSimple(abs);
  });
});

// ─── loadPlugins — factory function pattern ─────────────

describe("loadPlugins — factory function pattern", () => {
  it("loads without options", async () => {
    const plugins = await loadPlugins([FACTORY]);
    expect(plugins).toHaveLength(1);
    expect(plugins[0].name).toBe("fixture-factory");
  });

  it("loads with options via tuple syntax", async () => {
    const plugins = await loadPlugins([[FACTORY, { name: "custom-name" }]]);
    expect(plugins).toHaveLength(1);
    expect(plugins[0].name).toBe("custom-name");
  });

  it("resolves mixed array (simple + factory)", async () => {
    const plugins = await loadPlugins([SIMPLE, [FACTORY, { name: "factory-instance" }]]);
    expect(plugins).toHaveLength(2);
    expect(plugins[0].name).toBe("fixture-simple");
    expect(plugins[1].name).toBe("factory-instance");
  });
});

// ─── loadPlugins — path traversal protection ────────────

describe("loadPlugins — path traversal protection", () => {
  it("blocks relative path escaping project root", async () => {
    await expect(loadPlugins(["../../../etc/passwd"])).rejects.toThrow(
      "[plugin-loader] Path traversal blocked"
    );
  });

  it("blocks absolute path outside project root", async () => {
    await expect(loadPlugins(["/usr/lib/evil.mjs"])).rejects.toThrow(
      "[plugin-loader] Path traversal blocked"
    );
  });

  it("allows relative path within project root", async () => {
    await expect(loadPlugins([SIMPLE])).resolves.toHaveLength(1);
  });

  it("allows absolute path within project root", async () => {
    const abs = resolve(process.cwd(), SIMPLE);
    await expect(loadPlugins([abs])).resolves.toHaveLength(1);
  });

  it("allows npm package name (bypasses guard)", async () => {
    // Uses a loosely-matching error because the package won't exist
    await expect(loadPlugins(["@docubook/plugin-sitemap"])).rejects.not.toThrow(
      "[plugin-loader] Path traversal blocked"
    );
  });
});

// ─── loadPlugins — validation errors ─────────────────────

describe("loadPlugins — validation errors", () => {
  it("throws when name is missing", async () => {
    await expect(loadPlugins([MISSING_NAME])).rejects.toThrow("must have a valid 'name' property");
  });

  it("throws when setup function is missing", async () => {
    await expect(loadPlugins([MISSING_SETUP])).rejects.toThrow(
      "must have a 'setup(build)' function"
    );
  });
});
