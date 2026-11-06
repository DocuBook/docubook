import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ClientConfig } from "../options";
import createSearchProvider, { retryable } from "../client/index";

const docsearch = vi.hoisted(() => vi.fn());
vi.mock("@docsearch/js/docsearch", () => ({ default: docsearch }));
vi.mock("@docsearch/sidepanel-js", () => ({ default: vi.fn() }));

/** Just enough DOM for the provider: mount points and the stylesheet <link>. */
class FakeElement {
  id = "";
  rel = "";
  href = "";
  hidden = false;
  dataset: Record<string, string> = {};
  children: FakeElement[] = [];
  onload: (() => void) | null = null;
  appendChild(child: FakeElement) {
    this.children.push(child);
    if (child.rel === "stylesheet") queueMicrotask(() => child.onload?.());
    return child;
  }
}

const config: ClientConfig = {
  module: "docsearch/client.js?v=test",
  askAi: false,
  relativeUrls: false,
  search: { appId: "APP123", apiKey: "search-key", indices: [{ name: "docs" }] },
};

describe("retryable", () => {
  it("shares one setup between callers and keeps a successful one", async () => {
    const create = vi.fn(async () => "instance");
    const load = retryable(create);
    expect(load()).toBe(load());
    await expect(load()).resolves.toBe("instance");
    await load();
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("forgets a failed setup, so the next call retries", async () => {
    const create = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("chunk failed"))
      .mockResolvedValue("instance");
    const load = retryable(create);
    await expect(load()).rejects.toThrow("chunk failed");
    await expect(load()).resolves.toBe("instance");
    expect(create).toHaveBeenCalledTimes(2);
  });
});

describe("createSearchProvider", () => {
  beforeEach(() => {
    const head = new FakeElement();
    const body = new FakeElement();
    vi.stubGlobal("HTMLElement", FakeElement);
    vi.stubGlobal("document", {
      head,
      body,
      activeElement: null,
      createElement: () => new FakeElement(),
      getElementById: (id: string) => body.children.find((el) => el.id === id) ?? null,
      querySelector: () => null,
    });
  });

  afterEach(() => {
    docsearch.mockReset();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("retries DocSearch after a failed load, and logs the failure", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const instance = { isOpen: false, open: vi.fn(), close: vi.fn() };
    docsearch
      .mockImplementationOnce(() => {
        throw new Error("chunk failed");
      })
      .mockImplementation(({ onReady }: { onReady: () => void }) => {
        onReady();
        return instance;
      });

    // The eager load on creation fails...
    const provider = createSearchProvider(config);
    await vi.waitFor(() => expect(error).toHaveBeenCalledTimes(1));
    expect(error.mock.calls[0][0]).toContain("[plugin:search-algolia]");

    // ...and the reader's open() loads it again instead of reusing the failure.
    provider.open();
    await vi.waitFor(() => expect(instance.open).toHaveBeenCalledTimes(1));

    provider.open();
    await vi.waitFor(() => expect(instance.open).toHaveBeenCalledTimes(2));
    expect(docsearch).toHaveBeenCalledTimes(2);
  });
});
