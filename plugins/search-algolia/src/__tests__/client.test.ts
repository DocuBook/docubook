import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ClientConfig } from "../options";
import createSearchProvider, { retryable } from "../client/index";

const docsearch = vi.hoisted(() => vi.fn());
const sidepanel = vi.hoisted(() => vi.fn());
vi.mock("@docsearch/js/docsearch", () => ({ default: docsearch }));
vi.mock("@docsearch/sidepanel-js", () => ({ default: sidepanel }));

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
    sidepanel.mockReset();
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

  it("closes the active surfaces when the host opens navigation", async () => {
    const search = {
      isOpen: false,
      open: vi.fn(() => {
        search.isOpen = true;
      }),
      close: vi.fn(() => {
        search.isOpen = false;
      }),
    };
    const panel = {
      isOpen: false,
      open: vi.fn(() => {
        panel.isOpen = true;
      }),
      close: vi.fn(() => {
        panel.isOpen = false;
      }),
    };
    docsearch.mockImplementation(({ onReady }) => {
      onReady();
      return search;
    });
    sidepanel.mockImplementation(({ onReady }) => {
      onReady();
      return panel;
    });
    const provider = createSearchProvider({
      ...config,
      askAi: true,
      assistant: { appId: "APP123", apiKey: "search-key", agentId: "agent", panel: {} },
    });
    provider.open();
    await vi.waitFor(() => expect(search.open).toHaveBeenCalledOnce());
    provider.close?.();
    expect(search.close).toHaveBeenCalledOnce();
    provider.askAi?.();
    await vi.waitFor(() => expect(panel.open).toHaveBeenCalledOnce());
    provider.close?.();
    expect(panel.close).toHaveBeenCalledOnce();
  });

  it("leaves focus to the host after dismissal but restores it after a normal close", async () => {
    const trigger = Object.assign(new FakeElement(), { focus: vi.fn() });
    Object.defineProperty(document, "activeElement", { value: trigger, configurable: true });
    let onClose!: () => void;
    const instance = {
      isOpen: false,
      open: vi.fn(() => {
        instance.isOpen = true;
      }),
      close: vi.fn(() => {
        instance.isOpen = false;
      }),
    };
    docsearch.mockImplementation((options) => {
      onClose = options.onClose;
      options.onReady();
      return instance;
    });
    const provider = createSearchProvider(config);
    provider.open();
    await vi.waitFor(() => expect(instance.open).toHaveBeenCalledOnce());
    provider.close?.();
    onClose(); // DocSearch may deliver its close callback after navigation focuses.
    expect(trigger.focus).not.toHaveBeenCalled();

    provider.open();
    await vi.waitFor(() => expect(instance.open).toHaveBeenCalledTimes(2));
    instance.close();
    onClose();
    expect(trigger.focus).toHaveBeenCalledOnce();
  });

  it("does not reopen Ask AI after dismissal while its panel is initializing", async () => {
    const search = { isOpen: false, open: vi.fn(), close: vi.fn() };
    const panel = { isOpen: false, open: vi.fn(), close: vi.fn() };
    let ready!: () => void;
    docsearch.mockImplementation(({ onReady }) => {
      onReady();
      return search;
    });
    sidepanel.mockImplementation(({ onReady }) => {
      ready = onReady;
      return panel;
    });
    const provider = createSearchProvider({
      ...config,
      askAi: true,
      assistant: { appId: "APP123", apiKey: "search-key", agentId: "agent", panel: {} },
    });
    provider.askAi?.();
    await vi.waitFor(() => expect(sidepanel).toHaveBeenCalledOnce());
    provider.close?.();
    ready();
    // A fresh intent may open it, but the dismissed intent must not open it
    // again when the same initialization promise resolves.
    provider.askAi?.();
    await vi.waitFor(() => expect(panel.open).toHaveBeenCalledOnce());
  });
});
