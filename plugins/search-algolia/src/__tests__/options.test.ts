import { describe, expect, it } from "vitest";
import { resolveOptions, serializeForScript } from "../options";

const MODULE = "docsearch/client.js?v=test";
const base = { appId: "APP123", apiKey: "search-key", indexName: "docs" };

describe("resolveOptions", () => {
  it("maps the minimal options to a keyword-only config", () => {
    expect(resolveOptions(base, MODULE)).toEqual({
      module: MODULE,
      askAi: false,
      relativeUrls: true,
      search: { appId: "APP123", apiKey: "search-key", indices: [{ name: "docs" }] },
    });
  });

  it("passes keyword search options through to DocSearch", () => {
    const config = resolveOptions(
      {
        ...base,
        searchParameters: { facetFilters: ["lang:en"] },
        placeholder: "Search the docs",
        maxResultsPerGroup: 5,
        disableUserPersonalization: true,
        translations: { button: { buttonText: "Find" } },
        relativeUrls: false,
      },
      MODULE
    );
    expect(config.relativeUrls).toBe(false);
    expect(config.search).toEqual({
      appId: "APP123",
      apiKey: "search-key",
      indices: [{ name: "docs", searchParameters: { facetFilters: ["lang:en"] } }],
      placeholder: "Search the docs",
      maxResultsPerGroup: 5,
      disableUserPersonalization: true,
      translations: { button: { buttonText: "Find" } },
    });
  });

  it("expands an agent ID string into an Ask AI config that leaves the indices to the agent", () => {
    const config = resolveOptions({ ...base, askAi: "agent-1" }, MODULE);
    expect(config.askAi).toBe(true);
    // No `indices`: an agent whose search tool is static rejects them (422).
    expect(config.assistant).toEqual({
      agentId: "agent-1",
      appId: "APP123",
      apiKey: "search-key",
      panel: {},
    });
  });

  it("leaves the indices to the agent when the object form omits them", () => {
    const config = resolveOptions({ ...base, askAi: { agentId: "agent-1" } }, MODULE);
    expect(config.assistant).not.toHaveProperty("indices");
  });

  it("maps Ask AI options to the side panel", () => {
    const config = resolveOptions(
      {
        ...base,
        askAi: {
          agentId: "agent-1",
          appId: "OTHERAPP",
          apiKey: "agent-key",
          indices: ["docs", "blog"],
          searchParameters: { docs: { distinct: false } },
          suggestedQuestions: true,
          variant: "inline",
          side: "left",
          width: 400,
          expandedWidth: "50vw",
          translations: { header: { title: "Assistant" } },
        },
      },
      MODULE
    );
    expect(config.assistant).toEqual({
      agentId: "agent-1",
      appId: "OTHERAPP",
      apiKey: "agent-key",
      indices: ["docs", "blog"],
      searchParameters: { docs: { distinct: false } },
      panel: {
        variant: "inline",
        side: "left",
        width: 400,
        expandedWidth: "50vw",
        suggestedQuestions: true,
        translations: { header: { title: "Assistant" } },
      },
    });
  });

  it("treats askAi: false as keyword search only", () => {
    const config = resolveOptions({ ...base, askAi: false }, MODULE);
    expect(config.askAi).toBe(false);
    expect(config).not.toHaveProperty("assistant");
  });

  it.each([
    ["no options", undefined, /options are required/],
    ["missing appId", { apiKey: "k", indexName: "i" }, /`appId` is required/],
    ["missing apiKey", { appId: "APP", indexName: "i" }, /`apiKey` is required/],
    ["missing indexName", { appId: "APP", apiKey: "k" }, /`indexName` is required/],
    ["lower-case appId", { ...base, appId: "app" }, /application ID/],
    ["appId that is not a host label", { ...base, appId: "APP.evil.com/x" }, /application ID/],
    ["bad maxResultsPerGroup", { ...base, maxResultsPerGroup: 0 }, /positive integer/],
    [
      "bad searchParameters",
      { ...base, searchParameters: [] },
      /`searchParameters` must be an object/,
    ],
    ["empty askAi", { ...base, askAi: " " }, /agent ID/],
    ["askAi without agentId", { ...base, askAi: {} }, /`askAi.agentId` is required/],
    ["bad askAi.appId", { ...base, askAi: { agentId: "a", appId: "x" } }, /`askAi.appId`/],
    ["bad askAi.variant", { ...base, askAi: { agentId: "a", variant: "modal" } }, /variant/],
    ["bad askAi.side", { ...base, askAi: { agentId: "a", side: "top" } }, /side/],
    ["bad askAi.indices", { ...base, askAi: { agentId: "a", indices: [] } }, /indices/],
    ["bad askAi.width", { ...base, askAi: { agentId: "a", width: -1 } }, /width/],
    [
      "bad askAi.searchParameters",
      { ...base, askAi: { agentId: "a", searchParameters: { docs: 1 } } },
      /searchParameters/,
    ],
  ])("rejects %s", (_label, options, message) => {
    expect(() => resolveOptions(options, MODULE)).toThrow(/^\[plugin:search-algolia\]/);
    expect(() => resolveOptions(options, MODULE)).toThrow(message);
  });
});

describe("serializeForScript", () => {
  it("cannot close the surrounding script element", () => {
    const json = serializeForScript({ placeholder: "</script><script>alert(1)</script>" });
    expect(json).not.toContain("<");
    expect(json).not.toContain(">");
    expect(JSON.parse(json)).toEqual({ placeholder: "</script><script>alert(1)</script>" });
  });

  it("escapes ampersands and JavaScript line separators reversibly", () => {
    const value = { text: "a & b \u2028 c \u2029" };
    const json = serializeForScript(value);
    expect(json).not.toMatch(/[&\u2028\u2029]/);
    expect(JSON.parse(json)).toEqual(value);
  });
});
