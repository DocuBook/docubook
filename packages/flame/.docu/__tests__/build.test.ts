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

    it("defaults to 10 when env is unset", () => {
      delete process.env.BUILD_CONCURRENCY;
      expect(parseConcurrency()).toBe(10);
    });

    it("parses valid numeric string", () => {
      process.env.BUILD_CONCURRENCY = "5";
      expect(parseConcurrency()).toBe(5);
    });

    it("falls back to 10 for non-numeric string", () => {
      process.env.BUILD_CONCURRENCY = "abc";
      expect(parseConcurrency()).toBe(10);
    });

    it("falls back to 10 for empty string", () => {
      process.env.BUILD_CONCURRENCY = "";
      expect(parseConcurrency()).toBe(10);
    });

    it("falls back to 10 for zero (falsy)", () => {
      process.env.BUILD_CONCURRENCY = "0";
      expect(parseConcurrency()).toBe(10);
    });

    it("clamps to minimum 1 for negative values", () => {
      process.env.BUILD_CONCURRENCY = "-5";
      expect(parseConcurrency()).toBe(1);
    });
  });

  describe("shouldRebuild logic", () => {
    it("returns true when path is not in cache", () => {
      expect(shouldRebuild("docs/intro", 1000, {})).toBe(true);
    });

    it("returns true when file is newer than cache", () => {
      const cache = { "docs/intro": { builtAt: 1000 } };
      expect(shouldRebuild("docs/intro", 2000, cache)).toBe(true);
    });

    it("returns false when file is older than cache", () => {
      const cache = { "docs/intro": { builtAt: 2000 } };
      expect(shouldRebuild("docs/intro", 1000, cache)).toBe(false);
    });

    it("returns false when mtime equals builtAt", () => {
      const cache = { "docs/intro": { builtAt: 1000 } };
      expect(shouldRebuild("docs/intro", 1000, cache)).toBe(false);
    });
  });
});
