import { describe, it, expect } from "vitest";
import { safeParseTocs } from "../node/parse-tocs";

describe("client hydration", () => {
  describe("safeParseTocs", () => {
    it("parses valid JSON array", () => {
      const input = JSON.stringify([{ depth: 2, text: "Intro", id: "intro" }]);
      expect(safeParseTocs(input)).toEqual([{ depth: 2, text: "Intro", id: "intro" }]);
    });

    it("returns empty array for undefined", () => {
      expect(safeParseTocs(undefined)).toEqual([]);
    });

    it("returns empty array for empty string", () => {
      expect(safeParseTocs("")).toEqual([]);
    });

    it("returns empty array for invalid JSON", () => {
      expect(safeParseTocs("{broken")).toEqual([]);
    });

    it("returns empty array for null-like string", () => {
      expect(safeParseTocs("null")).toEqual([]);
    });
  });
});
