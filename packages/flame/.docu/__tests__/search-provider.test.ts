import { afterEach, describe, expect, it, vi } from "vitest";
import {
  loadSearchProvider,
  parseSearchProviderConfig,
  readSearchProviderConfig,
  resetSearchProviderCache,
  runSearchProvider,
  searchProviderUrl,
  dismissSearchSurfaces,
  type SearchProviderConfig,
} from "../node/search-provider";

afterEach(() => {
  resetSearchProviderCache();
  vi.restoreAllMocks();
});

describe("parseSearchProviderConfig", () => {
  it("returns null when no provider is declared", () => {
    expect(parseSearchProviderConfig(null)).toBeNull();
    expect(parseSearchProviderConfig(undefined)).toBeNull();
    expect(parseSearchProviderConfig("")).toBeNull();
  });

  it("keeps the module, the Ask AI flag and provider options", () => {
    const config = parseSearchProviderConfig(
      JSON.stringify({ module: "docsearch/client.js?v=1.2.3", askAi: true, search: { appId: "X" } })
    );
    expect(config).toEqual({
      module: "docsearch/client.js?v=1.2.3",
      askAi: true,
      search: { appId: "X" },
    });
  });

  it("rejects invalid JSON and non-object declarations", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(parseSearchProviderConfig("{")).toBeNull();
    expect(parseSearchProviderConfig("[]")).toBeNull();
    expect(parseSearchProviderConfig("42")).toBeNull();
    expect(error).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["missing", {}],
    ["not a string", { module: 42 }],
    ["absolute", { module: "/docsearch/client.js" }],
    ["protocol-relative", { module: "//evil.example/x.js" }],
    ["remote", { module: "https://evil.example/x.js" }],
    ["data URL", { module: "data:text/javascript,alert(1)" }],
    ["dot-relative", { module: "./client.js" }],
    ["parent segment", { module: "docsearch/../../x.js" }],
    ["leading parent", { module: "../x.js" }],
    ["backslash", { module: "docsearch\\client.js" }],
    ["not a script", { module: "docsearch/style.css" }],
  ])("refuses a %s module path", (_label, declaration) => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(parseSearchProviderConfig(JSON.stringify(declaration))).toBeNull();
    expect(error).toHaveBeenCalledOnce();
  });

  it("accepts nested module paths with a version query", () => {
    expect(
      parseSearchProviderConfig(JSON.stringify({ module: "plugins/@scope/x/client.mjs?v=2" }))
    ).toEqual({ module: "plugins/@scope/x/client.mjs?v=2" });
  });
});

describe("readSearchProviderConfig", () => {
  it("returns null outside a browser", () => {
    expect(readSearchProviderConfig()).toBeNull();
  });
});

describe("searchProviderUrl", () => {
  const config: SearchProviderConfig = { module: "docsearch/client.js" };

  it("resolves the module inside the bundle directory", () => {
    expect(searchProviderUrl(config, "", "/assets")).toBe("/assets/docsearch/client.js");
  });

  it("carries the host's deployment path and experimental.pages bundle path", () => {
    expect(searchProviderUrl(config, "/repo", "/docs/_flame")).toBe(
      "/repo/docs/_flame/docsearch/client.js"
    );
  });
});

describe("loadSearchProvider", () => {
  const config: SearchProviderConfig = { module: "p/client.js", askAi: true };

  it("imports the module once and passes the config to its factory", async () => {
    const provider = { open: vi.fn() };
    const factory = vi.fn(() => provider);
    const importModule = vi.fn(async () => ({ default: factory }));

    const first = await loadSearchProvider(config, "/assets/p/client.js", importModule);
    const second = await loadSearchProvider(config, "/assets/p/client.js", importModule);

    expect(first).toBe(provider);
    expect(second).toBe(provider);
    expect(importModule).toHaveBeenCalledOnce();
    expect(factory).toHaveBeenCalledWith(config);
  });

  it("accepts an async factory", async () => {
    const provider = { open: vi.fn() };
    const importModule = async () => ({ default: async () => provider });
    await expect(loadSearchProvider(config, "/a.js", importModule)).resolves.toBe(provider);
  });

  it("retries after a failed import instead of caching the failure", async () => {
    const provider = { open: vi.fn() };
    const importModule = vi
      .fn<(url: string) => Promise<{ default?: unknown }>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ default: () => provider });

    await expect(loadSearchProvider(config, "/a.js", importModule)).rejects.toThrow("offline");
    await expect(loadSearchProvider(config, "/a.js", importModule)).resolves.toBe(provider);
    expect(importModule).toHaveBeenCalledTimes(2);
  });

  it("rejects a module without a default factory", async () => {
    await expect(loadSearchProvider(config, "/a.js", async () => ({}))).rejects.toThrow(
      /no default export/
    );
  });
});

describe("runSearchProvider", () => {
  it("closes an already loaded provider when navigation takes over", async () => {
    const provider = { open: vi.fn(), close: vi.fn() };
    await runSearchProvider("search", { module: "p.js" }, "/p.js", async () => ({
      default: () => provider,
    }));
    dismissSearchSurfaces();
    await vi.waitFor(() => expect(provider.close).toHaveBeenCalledOnce());
  });

  it("cancels a pending open when the drawer opens before the chunk loads", async () => {
    const provider = { open: vi.fn(), close: vi.fn() };
    let finish!: (module: { default: () => typeof provider }) => void;
    const opening = runSearchProvider(
      "search",
      { module: "p.js" },
      "/p.js",
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    dismissSearchSurfaces();
    finish({ default: () => provider });
    await opening;
    expect(provider.open).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(provider.close).toHaveBeenCalledOnce());
  });

  it("allows a new intent after dismissal without a stale close cancelling it", async () => {
    const provider = { open: vi.fn(), askAi: vi.fn(), close: vi.fn() };
    let finish!: (module: { default: () => typeof provider }) => void;
    const config = { module: "p.js", askAi: true };
    const first = runSearchProvider(
      "search",
      config,
      "/p.js",
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    dismissSearchSurfaces();
    const latest = runSearchProvider("askAi", config, "/p.js");
    finish({ default: () => provider });
    await Promise.all([first, latest]);
    expect(provider.open).not.toHaveBeenCalled();
    expect(provider.askAi).toHaveBeenCalledOnce();
    expect(provider.close).not.toHaveBeenCalled();
  });

  it("opens search", async () => {
    const provider = { open: vi.fn(), askAi: vi.fn() };
    await runSearchProvider("search", { module: "p.js" }, "/p.js", async () => ({
      default: () => provider,
    }));
    expect(provider.open).toHaveBeenCalledOnce();
    expect(provider.askAi).not.toHaveBeenCalled();
  });

  it("opens Ask AI only when the provider declares it", async () => {
    const provider = { open: vi.fn(), askAi: vi.fn() };
    const importModule = async () => ({ default: () => provider });

    await runSearchProvider("askAi", { module: "p.js" }, "/p.js", importModule);
    expect(provider.askAi).not.toHaveBeenCalled();

    resetSearchProviderCache();
    await runSearchProvider("askAi", { module: "p.js", askAi: true }, "/p.js", importModule);
    expect(provider.askAi).toHaveBeenCalledOnce();
    expect(provider.open).not.toHaveBeenCalled();
  });

  it("logs instead of throwing when the provider cannot load", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      runSearchProvider("search", { module: "p.js" }, "/p.js", async () => {
        throw new Error("404");
      })
    ).resolves.toBeUndefined();
    expect(error).toHaveBeenCalledWith(
      "[search] could not load the search provider",
      expect.any(Error)
    );
  });
});
