import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { MermaidMdx } from "../components/MermaidMdx";

// Mock mermaid module for client-side hydration tests
const mockInitialize = vi.fn();
const mockParse = vi.fn();
const mockRun = vi.fn();

vi.mock("mermaid", () => ({
  default: {
    initialize: (...args: unknown[]) => mockInitialize(...args),
    parse: (...args: unknown[]) => mockParse(...args),
    run: (...args: unknown[]) => mockRun(...args),
  },
}));

// jsdom does not provide IntersectionObserver. Stub it so that the lazy-render
// callback fires immediately with isIntersecting=true, allowing mockRun to be
// asserted in tests that reach the render path.
class FakeIntersectionObserver {
  private callback: IntersectionObserverCallback;
  constructor(cb: IntersectionObserverCallback) {
    this.callback = cb;
  }
  observe(target: Element) {
    // Immediately invoke as if the element is visible
    this.callback(
      [{ isIntersecting: true, target } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    );
  }
  disconnect() {}
  unobserve() {}
}

vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);

beforeEach(() => {
  vi.clearAllMocks();
});

// No vitest globals — RTL's auto-cleanup does not register, so unmount
// explicitly to disconnect each component's Mutation/IntersectionObservers
afterEach(() => {
  cleanup();
});

describe("MermaidMdx", () => {
  it("renders pre.mermaid placeholder with chart text (SSR)", () => {
    const { container } = render(<MermaidMdx chart="graph TD; A-->B;" />);
    const pre = container.querySelector("pre.mermaid");
    expect(pre).not.toBeNull();
    expect(pre?.textContent).toBe("graph TD; A-->B;");
    expect(pre?.getAttribute("id")).toMatch(/^mermaid-/);
  });

  it("renders nothing for empty chart", () => {
    const { container } = render(<MermaidMdx chart="" />);
    // Should render null — container should be empty
    expect(container.querySelector("pre")).toBeNull();
    expect(container.querySelector("div")).toBeNull();
  });

  it("accepts optional id prop", () => {
    const { container } = render(<MermaidMdx chart="graph TD" id="my-diagram" />);
    const pre = container.querySelector("pre.mermaid");
    expect(pre?.getAttribute("id")).toBe("my-diagram");
  });

  it("accepts optional className prop", () => {
    const { container } = render(<MermaidMdx chart="graph TD" className="extra-class" />);
    const pre = container.querySelector("pre.mermaid");
    expect(pre?.classList.contains("extra-class")).toBe(true);
    expect(pre?.classList.contains("not-prose")).toBe(true);
  });

  it("generates unique id per instance", () => {
    const { container } = render(
      <div>
        <MermaidMdx chart="graph TD" />
        <MermaidMdx chart="graph LR" />
      </div>
    );
    const pres = container.querySelectorAll("pre.mermaid");
    expect(pres.length).toBe(2);
    expect(pres[0]?.getAttribute("id")).not.toBe(pres[1]?.getAttribute("id"));
  });

  it("renders error fallback when mermaid.parse throws", async () => {
    mockParse.mockRejectedValueOnce(new Error("syntax error"));

    const { container } = render(<MermaidMdx chart="invalid syntax" />);

    // Wait for async useEffect to settle
    await vi.waitFor(() => {
      expect(container.textContent).toContain("Diagram rendering error");
    });

    expect(container.textContent).toContain("invalid syntax");
  });

  it("calls mermaid.initialize and parse on mount", async () => {
    mockParse.mockResolvedValueOnce(undefined);

    render(<MermaidMdx chart="graph TD; A-->B;" />);

    await vi.waitFor(() => {
      expect(mockInitialize).toHaveBeenCalledWith(expect.objectContaining({ startOnLoad: false }));
    });

    expect(mockParse).toHaveBeenCalledWith("graph TD; A-->B;");
  });

  it("renders not-prose class by default", () => {
    const { container } = render(<MermaidMdx chart="graph TD" />);
    expect(container.querySelector("pre.mermaid.not-prose")).not.toBeNull();
  });

  it("calls mermaid.run when element becomes visible (IntersectionObserver)", async () => {
    mockParse.mockResolvedValueOnce(undefined);

    render(<MermaidMdx chart="graph TD; A-->B;" />);

    await vi.waitFor(() => {
      expect(mockRun).toHaveBeenCalledWith(expect.objectContaining({ nodes: expect.any(Array) }));
    });
  });

  it("removes data-processed attribute before re-render on theme change", async () => {
    mockParse.mockResolvedValue(undefined);
    vi.useFakeTimers({ shouldAdvanceTime: true });

    const { container, unmount } = render(<MermaidMdx chart="graph TD; A-->B;" />);

    // Let the async init run so the component's MutationObserver is attached
    await vi.waitFor(() => {
      expect(mockRun).toHaveBeenCalled();
    });

    const pre = container.querySelector("pre.mermaid") as HTMLElement;
    expect(pre).not.toBeNull();

    // Simulate mermaid setting data-processed after initial render
    pre.setAttribute("data-processed", "true");
    mockRun.mockClear();

    // Capture whether data-processed was absent when run() fires
    let dataProcessedAtCallTime: string | null = "not-called";
    mockRun.mockImplementation(() => {
      dataProcessedAtCallTime = pre.getAttribute("data-processed");
    });

    // Simulate a theme change on <html class>
    document.documentElement.classList.add("dark");

    // Advance past the 200ms debounce
    await vi.advanceTimersByTimeAsync(250);

    // data-processed must have been absent when run() was called (the fix being tested)
    expect(dataProcessedAtCallTime).toBeNull();

    // Cleanup
    document.documentElement.classList.remove("dark");
    unmount();
    vi.useRealTimers();
  });

  it("does not re-run when a class mutation leaves the theme unchanged", async () => {
    mockParse.mockResolvedValue(undefined);
    vi.useFakeTimers({ shouldAdvanceTime: true });

    const { unmount } = render(<MermaidMdx chart="graph TD; A-->B;" />);

    await vi.waitFor(() => {
      expect(mockRun).toHaveBeenCalled();
    });
    mockRun.mockClear();

    // Mutates the class attribute without flipping the theme — the case
    // mount effects trigger on every page load
    document.documentElement.classList.add("unrelated-class");
    await vi.advanceTimersByTimeAsync(250);

    expect(mockRun).not.toHaveBeenCalled();

    document.documentElement.classList.remove("unrelated-class");
    unmount();
    vi.useRealTimers();
  });

  it("warns instead of showing the error fallback when a theme re-render fails", async () => {
    mockParse.mockResolvedValue(undefined);
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { container, unmount } = render(<MermaidMdx chart="graph TD; A-->B;" />);

    await vi.waitFor(() => {
      expect(mockRun).toHaveBeenCalled();
    });
    mockRun.mockClear();
    mockRun.mockRejectedValueOnce(new Error("detached node"));

    document.documentElement.classList.add("dark");
    await vi.advanceTimersByTimeAsync(250);

    await vi.waitFor(() => {
      expect(warnSpy).toHaveBeenCalledWith("[mermaid] diagram render error:", expect.any(Error));
    });
    expect(container.textContent).not.toContain("Diagram rendering error");

    document.documentElement.classList.remove("dark");
    warnSpy.mockRestore();
    unmount();
    vi.useRealTimers();
  });

  it("serializes overlapping runs instead of running them concurrently", async () => {
    mockParse.mockResolvedValue(undefined);
    vi.useFakeTimers({ shouldAdvanceTime: true });

    let resolveFirst!: () => void;
    const callOrder: string[] = [];
    mockRun.mockImplementationOnce(() => {
      callOrder.push("start-1");
      return new Promise<void>((resolve) => {
        resolveFirst = () => {
          callOrder.push("end-1");
          resolve();
        };
      });
    });
    mockRun.mockImplementationOnce(() => {
      callOrder.push("start-2");
      return Promise.resolve();
    });

    const { unmount } = render(<MermaidMdx chart="graph TD; A-->B;" />);

    // First run starts via the (stubbed) IntersectionObserver
    await vi.waitFor(() => {
      expect(mockRun).toHaveBeenCalledTimes(1);
    });

    // Theme flips while the first run is still in flight
    document.documentElement.classList.add("dark");
    await vi.advanceTimersByTimeAsync(250);

    // Second run must wait for the first to settle
    expect(mockRun).toHaveBeenCalledTimes(1);

    resolveFirst();
    await vi.waitFor(() => {
      expect(mockRun).toHaveBeenCalledTimes(2);
    });
    expect(callOrder).toEqual(["start-1", "end-1", "start-2"]);

    document.documentElement.classList.remove("dark");
    unmount();
    vi.useRealTimers();
  });

  describe("pan/zoom controls", () => {
    async function renderWithControls() {
      mockParse.mockResolvedValueOnce(undefined);
      const result = render(<MermaidMdx chart="graph TD; A-->B;" />);
      await vi.waitFor(() => {
        expect(
          result.container.querySelector('[aria-label="Pan and zoom controls"]')
        ).not.toBeNull();
      });
      return result;
    }

    it("shows all controls after the diagram renders", async () => {
      const { container } = await renderWithControls();
      const labels = [
        "Pan up",
        "Pan down",
        "Pan left",
        "Pan right",
        "Zoom in",
        "Zoom out",
        "Reset view",
        "Enter full screen",
      ];
      for (const label of labels) {
        expect(container.querySelector(`button[aria-label="${label}"]`)).not.toBeNull();
      }
    });

    it("does not show controls when panZoom is false", async () => {
      mockParse.mockResolvedValueOnce(undefined);
      const { container } = render(<MermaidMdx chart="graph TD; A-->B;" panZoom={false} />);
      await vi.waitFor(() => {
        expect(mockRun).toHaveBeenCalled();
      });
      expect(container.querySelector('[aria-label="Pan and zoom controls"]')).toBeNull();
    });

    it("zoom, pan, and reset buttons update the transform", async () => {
      const { container } = await renderWithControls();
      const layer = container.querySelector("pre.mermaid")?.parentElement as HTMLElement;

      fireEvent.click(container.querySelector('button[aria-label="Zoom in"]')!);
      expect(layer.style.transform).toBe("translate(0px, 0px) scale(1.2)");

      fireEvent.click(container.querySelector('button[aria-label="Pan right"]')!);
      expect(layer.style.transform).toBe("translate(50px, 0px) scale(1.2)");

      fireEvent.click(container.querySelector('button[aria-label="Reset view"]')!);
      expect(layer.style.transform).toBe("translate(0px, 0px) scale(1)");
    });

    it("clamps zoom at the maximum scale", async () => {
      const { container } = await renderWithControls();
      const layer = container.querySelector("pre.mermaid")?.parentElement as HTMLElement;
      const zoomIn = container.querySelector('button[aria-label="Zoom in"]')!;

      for (let i = 0; i < 20; i++) fireEvent.click(zoomIn);
      expect(layer.style.transform).toBe("translate(0px, 0px) scale(4)");
    });

    it("pans with arrow keys on the focused container", async () => {
      const { container } = await renderWithControls();
      const viewport = container.querySelector('[tabindex="0"]') as HTMLElement;
      const layer = container.querySelector("pre.mermaid")?.parentElement as HTMLElement;

      fireEvent.keyDown(viewport, { key: "ArrowRight" });
      expect(layer.style.transform).toBe("translate(50px, 0px) scale(1)");

      fireEvent.keyDown(viewport, { key: "ArrowUp" });
      expect(layer.style.transform).toBe("translate(50px, -50px) scale(1)");

      fireEvent.keyDown(viewport, { key: "0" });
      expect(layer.style.transform).toBe("translate(0px, 0px) scale(1)");
    });

    it("ignores key presses with modifier keys (browser shortcuts)", async () => {
      const { container } = await renderWithControls();
      const viewport = container.querySelector('[tabindex="0"]') as HTMLElement;
      const layer = container.querySelector("pre.mermaid")?.parentElement as HTMLElement;

      fireEvent.keyDown(viewport, { key: "-", ctrlKey: true });
      fireEvent.keyDown(viewport, { key: "=", metaKey: true });
      fireEvent.keyDown(viewport, { key: "ArrowLeft", altKey: true });
      expect(layer.style.transform).toBe("translate(0px, 0px) scale(1)");
    });

    it("toggles the fullscreen lightbox via button and Escape", async () => {
      const { container } = await renderWithControls();
      const viewport = container.querySelector('[tabindex="0"]') as HTMLElement;

      fireEvent.click(container.querySelector('button[aria-label="Enter full screen"]')!);
      expect(viewport.style.position).toBe("fixed");
      expect(document.body.style.overflow).toBe("hidden");
      expect(container.querySelector('button[aria-label="Exit full screen"]')).not.toBeNull();

      fireEvent.keyDown(viewport, { key: "Escape" });
      expect(viewport.style.position).toBe("relative");
      expect(document.body.style.overflow).toBe("");
      expect(container.querySelector('button[aria-label="Enter full screen"]')).not.toBeNull();
    });
  });
});
