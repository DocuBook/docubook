import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  BUILD_CACHE_VERSION,
  atomicWriteFile,
  computeTailwindCacheKey,
  hashMdxSources,
  hookMemoryPressure,
  isTailwindRelevantCss,
  runtimeStamp,
  tailwindExtraInputs,
} from "../node/cache-key";
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
