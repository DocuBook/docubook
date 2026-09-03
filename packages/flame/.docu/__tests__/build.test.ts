import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { parseConcurrency, shouldRebuild } from "../node/build";

describe("build pipeline", () => {
  describe("BUILD_CONCURRENCY parsing", () => {
    let originalEnv: string | undefined;

    beforeEach(() => {
      originalEnv = process.env.BUILD_CONCURRENCY;
    });

    afterEach(() => {
      if (originalEnv === undefined) {
        delete process.env.BUILD_CONCURRENCY;
      } else {
        process.env.BUILD_CONCURRENCY = originalEnv;
      }
    });

    it("defaults to 4 when env is unset", () => {
      delete process.env.BUILD_CONCURRENCY;
      expect(parseConcurrency()).toBe(4);
    });

    it("parses valid numeric string", () => {
      process.env.BUILD_CONCURRENCY = "5";
      expect(parseConcurrency()).toBe(5);
    });

    it("falls back to 4 for non-numeric string", () => {
      process.env.BUILD_CONCURRENCY = "abc";
      expect(parseConcurrency()).toBe(4);
    });

    it("falls back to 4 for empty string", () => {
      process.env.BUILD_CONCURRENCY = "";
      expect(parseConcurrency()).toBe(4);
    });

    it("falls back to 4 for zero (falsy)", () => {
      process.env.BUILD_CONCURRENCY = "0";
      expect(parseConcurrency()).toBe(4);
    });

    it("clamps to minimum 1 for negative values", () => {
      process.env.BUILD_CONCURRENCY = "-5";
      expect(parseConcurrency()).toBe(1);
    });
  });

  describe("shouldRebuild logic", () => {
    it("returns 'yes' when path is not in cache", () => {
      expect(shouldRebuild("docs/intro", 1000, {})).toBe("yes");
    });

    it("returns 'yes' for non-entry slots (__meta__ without entry shape)", () => {
      // __meta__ now carries version/runtime but must not satisfy isCacheEntry
      const cache = { __meta__: { version: 2, runtime: "bun-1.4.0" } } as unknown as Parameters<
        typeof shouldRebuild
      >[2];
      expect(shouldRebuild("__meta__", 1000, cache)).toBe("yes");
    });

    it("returns 'hash_check' when file is newer than cache (mtime changed)", () => {
      const cache = { "docs/intro": { hash: "abc123", mtime: 500, builtAt: 1000 } };
      expect(shouldRebuild("docs/intro", 5000, cache)).toBe("hash_check");
    });

    it("returns 'hash_check' on mtime drift within tolerance (fast rebuild)", () => {
      // Bun 1.4 starts 2x faster: mtimeMs float vs builtAt int can differ
      // by <2s even when content changed — must not false-hit "no".
      const cache = { "docs/intro": { hash: "abc123", mtime: 500, builtAt: 1000 } };
      expect(shouldRebuild("docs/intro", 1500, cache)).toBe("hash_check");
    });

    it("returns 'no' when file is older than cache", () => {
      const cache = { "docs/intro": { hash: "abc123", mtime: 500, builtAt: 5000 } };
      expect(shouldRebuild("docs/intro", 500, cache)).toBe("no");
    });

    it("returns 'no' when mtime equals builtAt", () => {
      const cache = { "docs/intro": { hash: "abc123", mtime: 1000, builtAt: 1000 } };
      expect(shouldRebuild("docs/intro", 1000, cache)).toBe("no");
    });
  });
});
