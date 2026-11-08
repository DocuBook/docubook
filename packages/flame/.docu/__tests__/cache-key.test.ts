import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  BUILD_CACHE_VERSION,
  atomicWriteFile,
  configStamp,
  pruneRemovedPages,
  previousPageKeys,
  computeTailwindCacheKey,
  hashMdxSources,
  hookMemoryPressure,
  isTailwindRelevantCss,
  manifestMatchesCache,
  packagesStamp,
  pluginsStamp,
  readStyleCss,
  runtimeStamp,
  tailwindExtraInputs,
} from "../node/cache-key";
import { WATCHED_PACKAGES, resolvePackages } from "../node/dev-watch";
import type { PluginEntry } from "../node/plugin";
import { clearDerivedPageCaches, registerPageContent, getPageContent } from "../node/mdx";

function makeProject(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "flame-tw-"));
  for (const [rel, content] of Object.entries(files)) {
    const full = join(root, rel);
    mkdirSync(join(full, ".."), { recursive: true });
    writeFileSync(full, content);
  }
  return root;
}

function cleanup(root: string): void {
  rmSync(root, { recursive: true, force: true });
}

describe("cache-key (Tailwind v4 CSS-first)", () => {
  it("key stable 16-hex, version bumped for new contract", () => {
    const root = makeProject({});
    try {
      const a = computeTailwindCacheKey("css", JSON.stringify({ t: 1 }), root);
      expect(a).toMatch(/^[0-9a-f]{16}$/);
      expect(BUILD_CACHE_VERSION).toBeGreaterThanOrEqual(3);
      expect(typeof runtimeStamp()).toBe("string");
    } finally {
      cleanup(root);
    }
  });

  it("busts when theme inputs change", () => {
    const root = makeProject({});
    try {
      const a = computeTailwindCacheKey("css", JSON.stringify({ t: 1 }), root);
      const b = computeTailwindCacheKey("css", JSON.stringify({ t: 2 }), root);
      expect(a).not.toBe(b);
    } finally {
      cleanup(root);
    }
  });

  it("is stable for identical inputs", () => {
    const root = makeProject({});
    try {
      const a = computeTailwindCacheKey("css", "theme", root);
      expect(computeTailwindCacheKey("css", "theme", root)).toBe(a);
    } finally {
      cleanup(root);
    }
  });

  it("segments delimited: (ab,c) != (a,bc)", () => {
    const root = makeProject({});
    try {
      const a = computeTailwindCacheKey("ab", "c", root);
      const b = computeTailwindCacheKey("a", "bc", root);
      expect(a).not.toBe(b);
    } finally {
      cleanup(root);
    }
  });

  it("busts on @theme change in docs/*.css", () => {
    const root = makeProject({ "docs/a.css": "@theme { --color-x: red; }" });
    try {
      const before = computeTailwindCacheKey("", "", root);
      writeFileSync(join(root, "docs/a.css"), "@theme { --color-x: blue; }");
      expect(computeTailwindCacheKey("", "", root)).not.toBe(before);
    } finally {
      cleanup(root);
    }
  });

  it("busts on v4 directives: @source/@plugin/@custom-variant/@utility/@apply/@config", () => {
    const cases = [
      '@source "../components";',
      '@plugin "daisyui";',
      "@custom-variant dark (&:is(.dark *));",
      "@utility foo { color: red; }",
      ".x { @apply bg-red-500; }",
      '@config "../tailwind.config.js";',
      "@layer base { * { color: red; } }",
      '@import "tailwindcss";',
    ];
    for (const css of cases) {
      const root = makeProject({ "docs/a.css": ".plain { color: red; }" });
      try {
        const before = computeTailwindCacheKey("", "", root);
        writeFileSync(join(root, "docs/a.css"), css);
        expect(computeTailwindCacheKey("", "", root), css).not.toBe(before);
      } finally {
        cleanup(root);
      }
    }
  });

  it("ignores plain CSS without tailwind directives", () => {
    const root = makeProject({ "docs/a.css": ".plain { color: red; }" });
    try {
      const before = computeTailwindCacheKey("", "", root);
      writeFileSync(join(root, "docs/a.css"), ".plain { color: blue; margin: 0; }");
      expect(computeTailwindCacheKey("", "", root)).toBe(before);
    } finally {
      cleanup(root);
    }
  });

  it("follows @import chain into nested files", () => {
    const root = makeProject({
      "docs/a.css": '@import "./theme.css";',
      "docs/theme.css": "@theme { --color-x: red; }",
    });
    try {
      const before = computeTailwindCacheKey("", "", root);
      writeFileSync(join(root, "docs/theme.css"), "@theme { --color-x: blue; }");
      expect(computeTailwindCacheKey("", "", root)).not.toBe(before);
    } finally {
      cleanup(root);
    }
  });

  it("breaks @import cycles without hanging", () => {
    const root = makeProject({
      "docs/a.css": '@import "./b.css"; @theme { --a: 1; }',
      "docs/b.css": '@import "./a.css"; @theme { --b: 2; }',
    });
    try {
      expect(() => computeTailwindCacheKey("", "", root)).not.toThrow();
      expect(tailwindExtraInputs(root)).toContain("--a");
    } finally {
      cleanup(root);
    }
  });

  it("busts on tailwind/postcss JS config change", () => {
    const root = makeProject({ "tailwind.config.js": "module.exports = { theme: { x: 1 } };" });
    try {
      const before = computeTailwindCacheKey("", "", root);
      writeFileSync(join(root, "tailwind.config.js"), "module.exports = { theme: { x: 2 } };");
      expect(computeTailwindCacheKey("", "", root)).not.toBe(before);
      writeFileSync(join(root, "postcss.config.js"), "module.exports = {};");
      expect(computeTailwindCacheKey("", "", root)).not.toBe(before);
    } finally {
      cleanup(root);
    }
  });

  it("busts on tailwindcss package.json range change", () => {
    const root = makeProject({
      "package.json": JSON.stringify({ dependencies: { tailwindcss: "^4.0.0" } }),
    });
    try {
      const before = computeTailwindCacheKey("", "", root);
      writeFileSync(
        join(root, "package.json"),
        JSON.stringify({ dependencies: { tailwindcss: "^4.1.0" } })
      );
      expect(computeTailwindCacheKey("", "", root)).not.toBe(before);
    } finally {
      cleanup(root);
    }
  });

  it("isTailwindRelevantCss matches v4 directives only", () => {
    expect(isTailwindRelevantCss("@theme { --x: 1; }")).toBe(true);
    expect(isTailwindRelevantCss('@source "../src";')).toBe(true);
    expect(isTailwindRelevantCss('@plugin "daisyui";')).toBe(true);
    expect(isTailwindRelevantCss("@custom-variant dark;")).toBe(true);
    expect(isTailwindRelevantCss("@utility foo {}")).toBe(true);
    expect(isTailwindRelevantCss('@config "./tw.js";')).toBe(true);
    expect(isTailwindRelevantCss(".x { @apply foo; }")).toBe(true);
    expect(isTailwindRelevantCss('@import "tailwindcss";')).toBe(true);
    expect(isTailwindRelevantCss(".plain { color: red; }")).toBe(false);
    expect(isTailwindRelevantCss("")).toBe(false);
  });

  it("never throws on missing root", () => {
    expect(() =>
      computeTailwindCacheKey("", "", join(tmpdir(), "flame-nope-missing"))
    ).not.toThrow();
    expect(() => tailwindExtraInputs(join(tmpdir(), "flame-nope-missing"))).not.toThrow();
  });

  it("hashMdxSources is order-independent (sorted keys)", () => {
    const a = hashMdxSources({ b: "2", a: "1" });
    const b = hashMdxSources({ a: "1", b: "2" });
    expect(a).toBe(b);
    expect(hashMdxSources({ a: "1", b: "changed" })).not.toBe(a);
  });

  it("folds a style stamp into the bundle hash when one is passed", () => {
    const sources = { intro: "export default function MDXContent(){}" };
    expect(hashMdxSources(sources, "css-a")).not.toBe(hashMdxSources(sources, "css-b"));
    expect(hashMdxSources(sources, "css-a")).toBe(hashMdxSources(sources, "css-a"));
  });

  it("keeps plain CSS from the entry stylesheet and its package imports", () => {
    // The bug this guards: Tailwind copies plain rules from the entry graph
    // (including package stylesheets like @docubook/markdown/styles.css) into
    // the emitted CSS, so editing them has to invalidate the stylesheet cache.
    const root = makeProject({
      "styles/globals.css": '@import "@docubook/markdown/styles.css";\n.entry{color:red}',
      "node_modules/@docubook/markdown/styles.css": ".pkg{color:red}",
    });
    const dir = join(root, "styles");
    try {
      const before = readStyleCss("globals.css", dir, root);
      expect(before).toContain(".entry{color:red}");
      expect(before).toContain(".pkg{color:red}");

      writeFileSync(join(root, "node_modules/@docubook/markdown/styles.css"), ".pkg{color:blue}");
      expect(readStyleCss("globals.css", dir, root)).not.toBe(before);
    } finally {
      cleanup(root);
    }
  });

  it("busts on a plain rule change in the entry stylesheet", () => {
    const root = makeProject({ "styles/globals.css": ".entry{color:red}" });
    const dir = join(root, "styles");
    try {
      const before = computeTailwindCacheKey(readStyleCss("globals.css", dir, root), "", root);
      writeFileSync(join(root, "styles/globals.css"), ".entry{color:blue}");
      expect(computeTailwindCacheKey(readStyleCss("globals.css", dir, root), "", root)).not.toBe(
        before
      );
    } finally {
      cleanup(root);
    }
  });

  it("finds a package stylesheet nested the way pnpm stores dependencies", () => {
    const store = "node_modules/.pnpm/@docubook+flame@1/node_modules";
    const root = makeProject({
      [`${store}/@docubook/markdown/styles.css`]: ".pkg{color:red}",
      [`${store}/@docubook/flame/styles/globals.css`]: '@import "@docubook/markdown/styles.css";',
    });
    try {
      const css = readStyleCss("globals.css", join(root, store, "@docubook/flame/styles"), root);
      expect(css).toContain(".pkg{color:red}");
    } finally {
      cleanup(root);
    }
  });

  it("does not fold the tailwind package tree into the entry key", () => {
    const root = makeProject({
      "styles/globals.css": '@import "tailwindcss";\n@theme { --x: 1; }',
      "node_modules/tailwindcss/package.json": JSON.stringify({ name: "tailwindcss" }),
    });
    try {
      const css = readStyleCss("globals.css", join(root, "styles"), root);
      expect(css).toContain("@theme");
      expect(css).not.toContain("tailwindcss/package.json");
    } finally {
      cleanup(root);
    }
  });

  it("packagesStamp follows a package's built output, installed or not", () => {
    const store = "node_modules/@docubook/markdown";
    const root = makeProject({ [`${store}/dist/index.js`]: "export const v = 1;\n" });
    try {
      const dir = join(root, store);
      const pkg = { name: "@docubook/markdown", dir, entry: join(dir, "dist/index.js") };
      const before = packagesStamp([pkg]);
      expect(before).toMatch(/^[0-9a-f]{16}$/);
      writeFileSync(pkg.entry, "export const v = 1;\n");
      expect(packagesStamp([pkg])).toBe(before);
      mkdirSync(join(dir, "dist/components"));
      writeFileSync(join(dir, "dist/components/Callout.js"), '"use client";\n');
      const nested = packagesStamp([pkg]);
      expect(nested).not.toBe(before);
      rmSync(pkg.entry);
      expect(packagesStamp([pkg])).not.toBe(nested);
    } finally {
      cleanup(root);
    }
  });

  it("packagesStamp covers every sibling package flame renders with", () => {
    const packages = resolvePackages();
    expect(packages.map((pkg) => pkg.name).sort()).toEqual([...WATCHED_PACKAGES].sort());
    expect(packagesStamp()).toBe(packagesStamp(packages));
    expect(packagesStamp(packages.slice(1))).not.toBe(packagesStamp(packages));
  });

  it("pluginsStamp follows plugin packages and local plugin files", () => {
    const store = "node_modules/@test/plugin";
    const manifest = (version: string) =>
      JSON.stringify({ name: "@test/plugin", version, main: "./dist/index.js" });
    const root = makeProject({
      [`${store}/package.json`]: manifest("1.0.0"),
      [`${store}/dist/index.js`]: "export default {};\n",
      "plugins/local.js": "export default {};\n",
    });
    try {
      const entries: PluginEntry[] = ["@test/plugin", ["./plugins/local.js", { a: 1 }]];
      const stamp = () => pluginsStamp(entries, root, root);
      const before = stamp();
      expect(before).toMatch(/^[0-9a-f]{16}$/);
      expect(stamp()).toBe(before);

      writeFileSync(join(root, store, "package.json"), manifest("1.0.1"));
      const upgraded = stamp();
      expect(upgraded).not.toBe(before);

      writeFileSync(join(root, store, "dist/index.js"), "export default { v: 2 };\n");
      const rebuilt = stamp();
      expect(rebuilt).not.toBe(upgraded);

      writeFileSync(join(root, "plugins/local.js"), "export default { v: 2 };\n");
      expect(stamp()).not.toBe(rebuilt);

      expect(pluginsStamp([], root, root)).not.toBe(stamp());

      // Extensionless local specifiers, as the docs write them, hash the file
      // the runtime loads, and a directory hashes its index file.
      writeFileSync(join(root, "plugins/reading-time.ts"), "export default {};\n");
      mkdirSync(join(root, "plugins/analytics"));
      writeFileSync(join(root, "plugins/analytics/index.js"), "export default {};\n");
      const bare = () =>
        pluginsStamp(["./plugins/reading-time", "./plugins/analytics"], root, root);
      const bareBefore = bare();
      expect(bareBefore).not.toBe(pluginsStamp(["./plugins/nope", "./plugins/nope2"], root, root));
      writeFileSync(join(root, "plugins/reading-time.ts"), "export default { v: 2 };\n");
      const bareEdited = bare();
      expect(bareEdited).not.toBe(bareBefore);
      writeFileSync(join(root, "plugins/analytics/index.js"), "export default { v: 2 };\n");
      expect(bare()).not.toBe(bareEdited);
      // Unresolvable plugins still fingerprint (as missing) instead of throwing.
      expect(pluginsStamp(["@test/nope", "./plugins/nope.js"], root, root)).toMatch(
        /^[0-9a-f]{16}$/
      );
    } finally {
      cleanup(root);
    }
  });

  it("pluginsStamp follows ESM-only plugin packages, found from a parent node_modules", () => {
    // `require.resolve` throws ERR_PACKAGE_PATH_NOT_EXPORTED for an
    // import-only `exports` map, though `import()` loads the plugin fine.
    const store = "node_modules/@test/esm";
    const manifest = (version: string) =>
      JSON.stringify({
        name: "@test/esm",
        version,
        type: "module",
        exports: { ".": { import: "./dist/index.js" } },
      });
    const root = makeProject({
      [`${store}/package.json`]: manifest("1.0.0"),
      [`${store}/dist/index.js`]: "export default {};\n",
      "app/lib/.keep": "",
    });
    try {
      // Looked up from a nested directory, as the loader's own module is.
      const stamp = () => pluginsStamp(["@test/esm"], root, join(root, "app/lib"));
      const before = stamp();
      expect(before).not.toBe(pluginsStamp(["@test/missing"], root, join(root, "app/lib")));
      writeFileSync(join(root, store, "package.json"), manifest("2.0.0"));
      const upgraded = stamp();
      expect(upgraded).not.toBe(before);
      writeFileSync(join(root, store, "dist/index.js"), "export default { v: 2 };\n");
      expect(stamp()).not.toBe(upgraded);
    } finally {
      cleanup(root);
    }
  });

  it("pluginsStamp is in the render stamp, so plugins no longer bypass the page cache", () => {
    const src = (rel: string) => readFileSync(new URL(`../node/${rel}`, import.meta.url), "utf-8");
    expect(src("cache-key.ts")).toContain('h.update("plugins\\0").update(pluginsStamp());');
    for (const file of ["build.ts", "build.impl.ts"]) {
      expect(src(file), file).not.toMatch(/rebuildDecision === "(no|hash_check)" && !builder/);
    }
  });

  it("atomicWriteFile never leaves a corrupt target", async () => {
    const dir = mkdtempSync(join(tmpdir(), "flame-cache-"));
    try {
      const target = join(dir, "cache.json");
      const { writeFile, rename, unlink } = await import("node:fs/promises");
      await atomicWriteFile(writeFile, rename, unlink, target, JSON.stringify({ ok: true }));
      const { readFile } = await import("node:fs/promises");
      expect(JSON.parse(await readFile(target, "utf-8"))).toEqual({ ok: true });
      // No tmp leftovers
      const { readdir } = await import("node:fs/promises");
      expect((await readdir(dir)).filter((f) => f.includes(".tmp-"))).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("memoryPressure hook clears derived page maps without throwing", () => {
    registerPageContent("/hook-test", "raw");
    expect(getPageContent("/hook-test")).toBe("raw");
    // Hook twice — second call is a no-op (idempotent guard)
    hookMemoryPressure(clearDerivedPageCaches);
    hookMemoryPressure(clearDerivedPageCaches);
    // Simulate the OS event Bun 1.4 emits
    (process as NodeJS.EventEmitter).emit("memoryPressure", "critical");
    expect(getPageContent("/hook-test")).toBeUndefined();
    // Emitting with no maps registered must not throw
    expect(() => (process as NodeJS.EventEmitter).emit("memoryPressure", "warning")).not.toThrow();
  });
});

describe("configStamp — docu.json in the cache key", () => {
  const base = { meta: { title: "Docs" }, navbar: { logoText: "Docs", menu: [] }, routes: [] };

  it("is stable for the same config and changes with any field", () => {
    expect(configStamp(base)).toBe(configStamp(structuredClone(base)));
    expect(configStamp(base)).toMatch(/^[a-f0-9]{16}$/);
    const renamed = { ...base, navbar: { ...base.navbar, logoText: "Renamed" } };
    const withRoute = { ...base, routes: [{ title: "Overview", href: "/overview" }] };
    const withRepo = { ...base, repo: { url: "https://example.com/repo", path: "", edit: false } };
    for (const changed of [renamed, withRoute, withRepo]) {
      expect(configStamp(changed)).not.toBe(configStamp(base));
    }
  });

  it("treats a missing config as empty instead of throwing", () => {
    expect(configStamp(null)).toBe(configStamp(null));
    expect(configStamp(undefined)).toMatch(/^[a-f0-9]{16}$/);
  });

  it("is folded into the bundle hash and the page-asset key of both builds", () => {
    const src = (rel: string) => readFileSync(new URL(`../node/${rel}`, import.meta.url), "utf-8");
    expect(src("cache-key.ts")).toMatch(/hashMdxSources[\s\S]*\$\{configStamp\(\)\}/);
    for (const file of ["build.ts", "build.impl.ts"]) {
      expect(src(file), file).toContain(
        "const assetHash = `${JSON.stringify(assetManifest)}\\0${configStamp()}`;"
      );
      const code = src(file);
      expect(code, file).toMatch(
        /pruneRemovedPages\(\s*cache,\s*mdxFiles\.map\(\(f\) => f\.path\),\s*DOCS_OUT_DIR,\s*previousPages\s*\)/
      );
      expect(code, file).toContain("const previousPages = previousPageKeys(CACHE_FILE);");
      // Pruning must precede every generated page that can share a docs path
      // (docs index, 404) and the plugins' onEnd.
      const prune = code.indexOf("await pruneRemovedPages(");
      expect(prune, file).toBeGreaterThan(code.indexOf("await Promise.all(buildTasks.slice("));
      expect(prune, file).toBeLessThan(code.indexOf("await writeFile(docsIndexPath, indexHtml)"));
      expect(prune, file).toBeLessThan(code.indexOf("await writeFile(notFoundOut, notFoundHtml)"));
      expect(prune, file).toBeLessThan(code.indexOf("runOnEnd("));
    }
    expect(BUILD_CACHE_VERSION).toBeGreaterThanOrEqual(9);
  });
});

describe("pruneRemovedPages — pages whose source is gone", () => {
  function setup() {
    const out = mkdtempSync(join(tmpdir(), "flame-prune-"));
    for (const rel of ["guide/routing.html", "guide/routes.html", "intro.html", "keep.txt"]) {
      mkdirSync(join(out, rel, ".."), { recursive: true });
      writeFileSync(join(out, rel), "x");
    }
    return out;
  }

  it("removes the HTML and cache entries of removed pages only", async () => {
    const out = setup();
    const entry = { hash: "h", mtime: 1, builtAt: 1 };
    const cache: Record<string, unknown> = {
      __meta__: entry,
      __bundle__: entry,
      __assets__: entry,
      "guide/routing": entry,
      "guide/routes": entry,
      intro: entry,
    };
    const removed = await pruneRemovedPages(cache, ["guide/routes", "intro"], out);
    expect(removed).toEqual(["guide/routing"]);
    expect(existsSync(join(out, "guide/routing.html"))).toBe(false);
    expect(existsSync(join(out, "guide/routes.html"))).toBe(true);
    expect(existsSync(join(out, "intro.html"))).toBe(true);
    expect(existsSync(join(out, "keep.txt"))).toBe(true);
    expect(Object.keys(cache).sort()).toEqual(
      ["__assets__", "__bundle__", "__meta__", "guide/routes", "intro"].sort()
    );
    rmSync(out, { recursive: true, force: true });
  });

  it("never touches files outside the docs output for a tampered key", async () => {
    const parent = mkdtempSync(join(tmpdir(), "flame-prune-parent-"));
    const out = join(parent, "dist");
    mkdirSync(out, { recursive: true });
    writeFileSync(join(parent, "secret.html"), "x");
    const cache: Record<string, unknown> = { "../secret": { hash: "h", mtime: 1, builtAt: 1 } };
    const removed = await pruneRemovedPages(cache, [], out);
    expect(removed).toEqual(["../secret"]);
    expect(existsSync(join(parent, "secret.html"))).toBe(true);
    expect(cache).toEqual({});
    rmSync(parent, { recursive: true, force: true });
  });

  it("does nothing when every cached page still exists", async () => {
    const out = setup();
    const cache: Record<string, unknown> = { intro: { hash: "h", mtime: 1, builtAt: 1 } };
    expect(await pruneRemovedPages(cache, ["intro"], out)).toEqual([]);
    expect(existsSync(join(out, "intro.html"))).toBe(true);
    rmSync(out, { recursive: true, force: true });
  });
});

describe("previousPageKeys — pages a discarded cache recorded", () => {
  function file(content: string): string {
    const dir = mkdtempSync(join(tmpdir(), "flame-prev-"));
    const path = join(dir, "build-cache.json");
    writeFileSync(path, content);
    return path;
  }

  it("returns page keys regardless of the cache version or stamps", () => {
    const path = file(
      JSON.stringify({
        __meta__: { version: 1, runtime: "bun-0.0.1", hash: "x", mtime: 0, builtAt: 0 },
        __bundle__: { hash: "b", mtime: 0, builtAt: 0 },
        "guide/routing": { hash: "h", mtime: 1, builtAt: 1 },
        intro: { hash: "h", mtime: 1, builtAt: 1 },
      })
    );
    expect(previousPageKeys(path).sort()).toEqual(["guide/routing", "intro"]);
  });

  it("yields nothing for a missing, corrupt or non-object file", () => {
    expect(previousPageKeys(join(tmpdir(), "flame-no-such-cache.json"))).toEqual([]);
    expect(previousPageKeys(file("{ not json"))).toEqual([]);
    expect(previousPageKeys(file("[1, 2]"))).toEqual([]);
    expect(previousPageKeys(file("null"))).toEqual([]);
  });

  it("lets pruning remove pages the in-memory cache no longer knows (--force, upgrade)", async () => {
    const out = mkdtempSync(join(tmpdir(), "flame-prune-prev-"));
    for (const rel of ["gone.html", "kept.html"]) writeFileSync(join(out, rel), "x");
    const cache: Record<string, unknown> = {};
    const removed = await pruneRemovedPages(cache, ["kept"], out, ["gone", "kept", "__meta__"]);
    expect(removed).toEqual(["gone"]);
    expect(existsSync(join(out, "gone.html"))).toBe(false);
    expect(existsSync(join(out, "kept.html"))).toBe(true);
    rmSync(out, { recursive: true, force: true });
  });
});

describe("manifestMatchesCache", () => {
  const manifest = JSON.stringify({
    docs: { js: "client-abc.js", css: "docs-1.css" },
    notFound: { css: "site-1.css" },
  });
  it("accepts the manifest the last build recorded", () => {
    expect(manifestMatchesCache(manifest, `${manifest}\0config-stamp`)).toBe(true);
  });
  it("rejects a manifest written by another process", () => {
    const devManifest = JSON.stringify({
      docs: { js: "client-dev.js", css: "docs-1.css" },
      notFound: { css: "site-1.css" },
    });
    expect(manifestMatchesCache(devManifest, `${manifest}\0config-stamp`)).toBe(false);
  });
  it("rejects when the cache has no assets entry", () => {
    expect(manifestMatchesCache(manifest, undefined)).toBe(false);
  });
});
