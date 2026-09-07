import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, fireEvent, cleanup } from "@testing-library/react";
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
  vi.resetAllMocks();
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

  it("restores chart text and clears data-processed on chart changes", async () => {
    const charts: string[] = [];
    mockRun.mockImplementation(({ nodes }: { nodes: HTMLElement[] }) => {
      const node = nodes[0];
      if (node.hasAttribute("data-processed")) return;
      charts.push(node.textContent!);
      node.setAttribute("data-processed", "true");
      node.innerHTML = "<svg><text>Rendered diagram</text></svg>";
    });
    const { container, rerender } = render(<MermaidMdx chart="graph TD; A-->B;" />);
    await vi.waitFor(() => expect(charts).toHaveLength(1));

    rerender(<MermaidMdx chart="graph LR; C-->D;" />);
    await vi.waitFor(() => expect(mockRun).toHaveBeenCalledTimes(2));
    expect(charts).toEqual(["graph TD; A-->B;", "graph LR; C-->D;"]);
    expect(container.querySelector("pre.mermaid svg")).not.toBeNull();
  });

  it.each(["resolve", "reject"])(
    "waits for stale runs to %s before resetting the latest chart",
    async (outcome) => {
      let settleFirst!: () => void;
      mockRun.mockImplementationOnce(({ nodes }: { nodes: HTMLElement[] }) => {
        nodes[0].setAttribute("data-processed", "true");
        return new Promise<void>((resolve, reject) => {
          settleFirst = () => {
            // In-flight Mermaid work can write again after props have changed.
            nodes[0].textContent = "stale output";
            nodes[0].setAttribute("data-processed", "true");
            if (outcome === "reject") reject(new Error("stale render failure"));
            else resolve();
          };
        });
      });
      const { container, rerender } = render(<MermaidMdx chart="graph TD; A-->B;" />);
      await vi.waitFor(() => expect(mockRun).toHaveBeenCalledTimes(1));
      const pre = container.querySelector("pre.mermaid")!;

      try {
        await act(async () => rerender(<MermaidMdx chart="graph LR; C-->D;" />));
        await act(async () => rerender(<MermaidMdx chart="graph TD; E-->F;" />));
        expect(mockParse).toHaveBeenCalledWith("graph TD; E-->F;");
        expect(mockRun).toHaveBeenCalledTimes(1);
        expect(pre.getAttribute("data-processed")).toBe("true");
        expect(container.querySelector('button[aria-label="Enter full screen"]')).toBeNull();
        mockRun.mockImplementationOnce(({ nodes }: { nodes: HTMLElement[] }) => {
          expect(nodes[0]).toBe(pre);
          expect(nodes[0].textContent).toBe("graph TD; E-->F;");
          expect(nodes[0].hasAttribute("data-processed")).toBe(false);
          nodes[0].innerHTML = "<svg><text>Latest diagram</text></svg>";
        });
      } finally {
        await act(async () => settleFirst());
      }
      expect(mockRun).toHaveBeenCalledTimes(2);
      expect(pre.textContent).toBe("Latest diagram");
      expect(container.textContent).not.toContain("Diagram rendering error");
      expect(container.querySelector('button[aria-label="Enter full screen"]')).not.toBeNull();
    }
  );

  it.each(["resolve", "reject"])("ignores stale parsing that finishes with %s", async (outcome) => {
    let settleParse!: () => void;
    mockParse.mockImplementationOnce(
      () =>
        new Promise<void>((resolve, reject) => {
          settleParse = () => {
            if (outcome === "reject") reject(new Error("stale syntax error"));
            else resolve();
          };
        })
    );
    const { container, rerender } = render(<MermaidMdx chart="old chart" />);
    await vi.waitFor(() => expect(mockParse).toHaveBeenCalledTimes(1));
    rerender(<MermaidMdx chart="graph TD; A-->B;" />);
    await vi.waitFor(() => expect(mockRun).toHaveBeenCalledTimes(1));
    await act(async () => settleParse());
    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(container.textContent).not.toContain("Diagram rendering error");
    expect(container.querySelector('button[aria-label="Enter full screen"]')).not.toBeNull();
  });

  it("skips queued chart work after unmount", async () => {
    let finishRun!: () => void;
    mockRun.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishRun = resolve;
        })
    );
    const { rerender, unmount } = render(<MermaidMdx chart="graph TD; A-->B;" />);
    await vi.waitFor(() => expect(mockRun).toHaveBeenCalledTimes(1));
    await act(async () => rerender(<MermaidMdx chart="graph LR; C-->D;" />));
    unmount();
    await act(async () => finishRun());
    expect(mockRun).toHaveBeenCalledTimes(1);
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
    async function renderAndEnterFullscreen() {
      mockParse.mockResolvedValueOnce(undefined);
      const result = render(<MermaidMdx chart="graph TD; A-->B;" />);
      await vi.waitFor(() => {
        expect(
          result.container.querySelector('button[aria-label="Enter full screen"]')
        ).not.toBeNull();
      });
      // Enter fullscreen to show all pan/zoom controls
      fireEvent.click(result.container.querySelector('button[aria-label="Enter full screen"]')!);
      await vi.waitFor(() => {
        expect(
          result.container.querySelector('[aria-label="Pan and zoom controls"]')
        ).not.toBeNull();
      });
      return result;
    }

    // NOTE: this must run before any other test in this describe — the help
    // panel auto-opens only on the first fullscreen entry per module (hintSeen)
    it("auto-opens the help panel on the first fullscreen entry", async () => {
      const { container } = await renderAndEnterFullscreen();
      expect(container.textContent).toContain("Canvas controls");
      expect(container.textContent).toContain("hold scroll wheel or tap & drag");
    });

    it("shows only fullscreen button after render, full controls in fullscreen", async () => {
      mockParse.mockResolvedValueOnce(undefined);
      const { container } = render(<MermaidMdx chart="graph TD; A-->B;" />);

      await vi.waitFor(() => {
        expect(container.querySelector('button[aria-label="Enter full screen"]')).not.toBeNull();
      });

      // Outside fullscreen: only the fullscreen button, no pan/zoom grid
      expect(container.querySelector('[aria-label="Pan and zoom controls"]')).toBeNull();
      expect(container.querySelector('button[aria-label="Pan up"]')).toBeNull();

      // Enter fullscreen — all controls appear
      fireEvent.click(container.querySelector('button[aria-label="Enter full screen"]')!);
      await vi.waitFor(() => {
        expect(container.querySelector('[aria-label="Pan and zoom controls"]')).not.toBeNull();
      });

      const labels = ["Exit full screen", "Zoom in", "Zoom out", "Reset view"];
      for (const label of labels) {
        expect(container.querySelector(`button[aria-label="${label}"]`)).not.toBeNull();
      }
    });

    it("zoom and reset buttons update the transform", async () => {
      const { container } = await renderAndEnterFullscreen();
      const layer = container.querySelector("pre.mermaid")?.parentElement as HTMLElement;

      fireEvent.click(container.querySelector('button[aria-label="Zoom in"]')!);
      expect(layer.style.transform).toBe("translate(0px, 0px) scale(1.2)");

      // Panning stays keyboard-driven (arrow keys)
      const viewport = container.querySelector('[tabindex="0"]') as HTMLElement;
      fireEvent.keyDown(viewport, { key: "ArrowRight" });
      expect(layer.style.transform).toBe("translate(50px, 0px) scale(1.2)");

      fireEvent.click(container.querySelector('button[aria-label="Reset view"]')!);
      expect(layer.style.transform).toBe("translate(0px, 0px) scale(1)");
    });

    it("clamps zoom at the maximum scale", async () => {
      const { container } = await renderAndEnterFullscreen();
      const layer = container.querySelector("pre.mermaid")?.parentElement as HTMLElement;
      const zoomIn = container.querySelector('button[aria-label="Zoom in"]')!;

      for (let i = 0; i < 20; i++) fireEvent.click(zoomIn);
      expect(layer.style.transform).toBe("translate(0px, 0px) scale(4)");
    });

    it("pans with arrow keys in fullscreen mode", async () => {
      const { container } = await renderAndEnterFullscreen();
      const viewport = container.querySelector('[tabindex="0"]') as HTMLElement;
      const layer = container.querySelector("pre.mermaid")?.parentElement as HTMLElement;

      fireEvent.keyDown(viewport, { key: "ArrowRight" });
      expect(layer.style.transform).toBe("translate(50px, 0px) scale(1)");

      fireEvent.keyDown(viewport, { key: "ArrowUp" });
      expect(layer.style.transform).toBe("translate(50px, -50px) scale(1)");

      fireEvent.keyDown(viewport, { key: "0" });
      expect(layer.style.transform).toBe("translate(0px, 0px) scale(1)");
    });

    it("ignores key presses with modifier keys in fullscreen", async () => {
      const { container } = await renderAndEnterFullscreen();
      const viewport = container.querySelector('[tabindex="0"]') as HTMLElement;
      const layer = container.querySelector("pre.mermaid")?.parentElement as HTMLElement;

      fireEvent.keyDown(viewport, { key: "-", ctrlKey: true });
      fireEvent.keyDown(viewport, { key: "=", metaKey: true });
      fireEvent.keyDown(viewport, { key: "ArrowLeft", altKey: true });
      expect(layer.style.transform).toBe("translate(0px, 0px) scale(1)");
    });

    it("zooms with mouse wheel in fullscreen mode", async () => {
      const { container } = await renderAndEnterFullscreen();
      const viewport = container.querySelector('[tabindex="0"]') as HTMLElement;
      const layer = container.querySelector("pre.mermaid")?.parentElement as HTMLElement;

      // Scroll up (negative delta) — zoom in
      fireEvent.wheel(viewport, { deltaY: -100 });
      expect(layer.style.transform).toBe("translate(0px, 0px) scale(1.2)");

      // Scroll down (positive delta) — zoom out
      fireEvent.wheel(viewport, { deltaY: 100 });
      expect(layer.style.transform).toBe("translate(0px, 0px) scale(1)");
    });

    it("clamps zoom at minimum scale when scrolling out", async () => {
      const { container } = await renderAndEnterFullscreen();
      const viewport = container.querySelector('[tabindex="0"]') as HTMLElement;
      const layer = container.querySelector("pre.mermaid")?.parentElement as HTMLElement;

      for (let i = 0; i < 20; i++) fireEvent.wheel(viewport, { deltaY: 100 });
      expect(layer.style.transform).toBe("translate(0px, 0px) scale(0.4)");
    });

    it("pans with mouse drag in fullscreen mode", async () => {
      const { container } = await renderAndEnterFullscreen();
      const viewport = container.querySelector('[tabindex="0"]') as HTMLElement;
      const layer = container.querySelector("pre.mermaid")?.parentElement as HTMLElement;

      // mousedown at (100, 100) then drag to (150, 120) = delta (+50, +20)
      fireEvent.mouseDown(viewport, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(viewport, { clientX: 150, clientY: 120 });
      expect(layer.style.transform).toBe("translate(50px, 20px) scale(1)");

      // Continue dragging to (180, 130) = additional delta (+30, +10)
      fireEvent.mouseMove(viewport, { clientX: 180, clientY: 130 });
      expect(layer.style.transform).toBe("translate(80px, 30px) scale(1)");

      // mouseUp stops dragging; subsequent mousemove does nothing
      fireEvent.mouseUp(viewport);
      fireEvent.mouseMove(viewport, { clientX: 200, clientY: 150 });
      expect(layer.style.transform).toBe("translate(80px, 30px) scale(1)");
    });

    it("shows the zoom percentage and resets to 100% on click", async () => {
      const { container } = await renderAndEnterFullscreen();
      const layer = container.querySelector("pre.mermaid")?.parentElement as HTMLElement;
      const pct = container.querySelector('button[aria-label="Reset view"]') as HTMLElement;

      expect(pct.textContent).toBe("100%");

      fireEvent.click(container.querySelector('button[aria-label="Zoom in"]')!);
      fireEvent.click(container.querySelector('button[aria-label="Zoom in"]')!);
      expect(pct.textContent).toBe("144%");
      expect(layer.style.transform).toBe("translate(0px, 0px) scale(1.44)");

      // Clicking the percentage resets to the default view
      fireEvent.click(pct);
      expect(pct.textContent).toBe("100%");
      expect(layer.style.transform).toBe("translate(0px, 0px) scale(1)");
    });

    it("pans with touch drag in fullscreen mode", async () => {
      const { container } = await renderAndEnterFullscreen();
      const viewport = container.querySelector('[tabindex="0"]') as HTMLElement;
      const layer = container.querySelector("pre.mermaid")?.parentElement as HTMLElement;

      fireEvent.touchStart(viewport, { touches: [{ clientX: 100, clientY: 100 }] });
      fireEvent.touchMove(viewport, { touches: [{ clientX: 150, clientY: 120 }] });
      expect(layer.style.transform).toBe("translate(50px, 20px) scale(1)");

      // touchEnd stops dragging; subsequent moves do nothing
      fireEvent.touchEnd(viewport, { touches: [] });
      fireEvent.touchMove(viewport, { touches: [{ clientX: 200, clientY: 150 }] });
      expect(layer.style.transform).toBe("translate(50px, 20px) scale(1)");
    });

    it("toggles fullscreen via button, Enter key, and Escape", async () => {
      mockParse.mockResolvedValueOnce(undefined);
      const { container } = render(<MermaidMdx chart="graph TD; A-->B;" />);

      await vi.waitFor(() => {
        expect(container.querySelector('button[aria-label="Enter full screen"]')).not.toBeNull();
      });

      const viewport = container.querySelector('[tabindex="0"]') as HTMLElement;

      // Enter via button click
      fireEvent.click(container.querySelector('button[aria-label="Enter full screen"]')!);
      expect(viewport.style.position).toBe("fixed");
      expect(document.body.style.overflow).toBe("hidden");
      expect(container.querySelector('button[aria-label="Exit full screen"]')).not.toBeNull();
      expect(container.querySelector('[aria-label="Pan and zoom controls"]')).not.toBeNull();

      // Exit via Escape
      fireEvent.keyDown(viewport, { key: "Escape" });
      expect(viewport.style.position).toBe("relative");
      expect(document.body.style.overflow).toBe("");
      expect(container.querySelector('button[aria-label="Enter full screen"]')).not.toBeNull();
      expect(container.querySelector('[aria-label="Pan and zoom controls"]')).toBeNull();

      // Enter via keyboard (Enter key) in non-fullscreen
      fireEvent.keyDown(viewport, { key: "Enter" });
      expect(viewport.style.position).toBe("fixed");
    });

    it("exits fullscreen via Esc even when a control has focus", async () => {
      const { container } = await renderAndEnterFullscreen();
      const viewport = container.querySelector('[tabindex="0"]') as HTMLElement;

      // Click a control button — focus leaves the canvas
      const zoomIn = container.querySelector('button[aria-label="Zoom in"]') as HTMLElement;
      fireEvent.click(zoomIn);

      // Esc dispatched on the focused control must still exit (window-level listener)
      fireEvent.keyDown(zoomIn, { key: "Escape" });
      expect(viewport.style.position).toBe("relative");
    });

    it("toggles the help panel via the help button", async () => {
      const { container } = await renderAndEnterFullscreen();
      const help = container.querySelector('button[aria-label="Toggle help"]') as HTMLElement;

      // Collapse whatever the current state is, then toggle both ways
      if (container.textContent.includes("Canvas controls")) fireEvent.click(help);
      expect(container.textContent).not.toContain("Canvas controls");
      fireEvent.click(help);
      expect(container.textContent).toContain("Canvas controls");
      fireEvent.click(help);
      expect(container.textContent).not.toContain("Canvas controls");
    });

    it("closes the help panel when exiting fullscreen", async () => {
      const { container } = await renderAndEnterFullscreen();
      const help = container.querySelector('button[aria-label="Toggle help"]') as HTMLElement;
      const viewport = container.querySelector('[tabindex="0"]') as HTMLElement;

      // Open the panel manually (auto-open was consumed by an earlier test)
      if (!container.textContent.includes("Canvas controls")) fireEvent.click(help);
      expect(container.textContent).toContain("Canvas controls");

      // Exit fullscreen with the panel open → it must collapse
      fireEvent.keyDown(viewport, { key: "Escape" });
      expect(viewport.style.position).toBe("relative");

      // Re-enter → panel stays collapsed (one-time onboarding, not per entry)
      fireEvent.keyDown(viewport, { key: "Enter" });
      expect(container.textContent).not.toContain("Canvas controls");
    });
  });
});
