"use client";

import {
  useId,
  useRef,
  useEffect,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import type { Mermaid } from "mermaid";

// Module-level singleton — one dynamic import regardless of diagram count
let mermaidPromise: Promise<typeof import("mermaid")> | null = null;
// One-time onboarding — help panel auto-opens on first fullscreen entry per
// page load (not per diagram); re-openable via the help button
let hintSeen = false;

interface MermaidMdxProps {
  /** Mermaid diagram definition (from rehype plugin or programmatic) */
  chart: string;
  /** Custom DOM id (auto-generated if omitted) */
  id?: string;
  /** Additional CSS class on container */
  className?: string;
}

function getTheme(): "dark" | "default" {
  return document.documentElement.classList.contains("dark") ? "dark" : "default";
}

// Pan/zoom tuning — drag/wheel/touch pan; zoom via the fullscreen control bar
const PAN_STEP = 50;
const ZOOM_STEP = 1.2;
const MIN_SCALE = 0.4;
const MAX_SCALE = 4;

const clampScale = (scale: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));

const controlButtonStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 28,
  height: 28,
  padding: 0,
  border: "1px solid rgba(127,127,127,0.35)",
  borderRadius: 6,
  background: "rgba(127,127,127,0.12)",
  color: "currentcolor",
  cursor: "pointer",
};

// Top-right chrome (ESC badge / help button) — pill look matching the zoom bar
const topBarButtonStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  padding: "6px 10px",
  border: "1px solid rgba(127,127,127,0.25)",
  borderRadius: 8,
  background: "rgba(127,127,127,0.12)",
  backdropFilter: "blur(8px)",
  color: "currentcolor",
  fontSize: 12,
  lineHeight: 1.4,
  cursor: "pointer",
};

function ControlButton({
  label,
  onClick,
  cell,
  children,
}: {
  label: string;
  onClick: () => void;
  cell: { col: number; row: number };
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{ ...controlButtonStyle, gridColumn: cell.col, gridRow: cell.row }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {children}
      </svg>
    </button>
  );
}

export function MermaidMdx({ chart, id, className }: MermaidMdxProps) {
  const generatedId = useId();
  const domId = id ?? `mermaid-${generatedId.replace(/[:.]/g, "-")}`;
  const ref = useRef<HTMLPreElement>(null);
  const chartRef = useRef(chart);
  const mermaidRef = useRef<Mermaid | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rendered, setRendered] = useState(false);
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const [fullscreen, setFullscreen] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const dragRef = useRef({ dragging: false, lastX: 0, lastY: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!chart) return;

    // Keep chartRef in sync so theme-change re-render (T-005) can restore text
    chartRef.current = chart;
    setError(null);
    setRendered(false);

    let cancelled = false;
    let lazyObserver: IntersectionObserver | null = null;
    let syncObserver: MutationObserver | null = null;
    let themeTimer: ReturnType<typeof setTimeout> | null = null;
    let lastTheme = getTheme();
    // Serialize mermaid.run calls — overlapping runs on the same node detach
    // in-flight SVG and crash inside d3's dispatchEvent (issue #268)
    let runChain: Promise<void> = Promise.resolve();

    function enqueueRun(run: () => Promise<void>): Promise<void> {
      const next = runChain.then(() => {
        if (cancelled || !ref.current?.isConnected) return;
        return run();
      });
      // Keep the chain alive after a failure; the caller handles rejection
      runChain = next.catch(() => {});
      return next;
    }

    async function init(): Promise<void> {
      try {
        // Invariant 6: singleton dynamic import
        if (!mermaidPromise) {
          mermaidPromise = import("mermaid");
        }
        const mod = await mermaidPromise;
        const mermaid = (mermaidRef.current = mod.default);

        mermaid.initialize({ startOnLoad: false, theme: getTheme() });

        // Validate syntax early — show error before attempting render
        try {
          await mermaid.parse(chart);
        } catch {
          if (!cancelled) setError("Invalid Mermaid syntax");
          return;
        }

        if (cancelled || !ref.current) return;

        // T-009: lazy rendering via IntersectionObserver
        lazyObserver = new IntersectionObserver(
          ([entry]) => {
            if (!entry.isIntersecting || cancelled || !ref.current) return;
            enqueueRun(() => {
              const node = ref.current;
              if (!node) return Promise.resolve();
              return mermaid.run({ nodes: [node] });
            })
              .then(() => {
                if (!cancelled) setRendered(true);
              })
              .catch(() => {
                if (!cancelled) setError("Failed to render diagram");
              });
            lazyObserver?.disconnect();
          },
          { rootMargin: "200px" }
        );
        lazyObserver.observe(ref.current);
      } catch {
        if (!cancelled) setError("Failed to load Mermaid renderer");
      }
    }

    init();

    // T-005: theme sync via MutationObserver on <html class>
    syncObserver = new MutationObserver(() => {
      if (themeTimer) clearTimeout(themeTimer);
      themeTimer = setTimeout(() => {
        if (cancelled || !mermaidRef.current || !ref.current) return;
        // Mount effects toggle the class without changing the theme — skip
        // so a spurious mutation cannot race the initial render (issue #268)
        if (getTheme() === lastTheme) return;
        enqueueRun(() => {
          const mermaid = mermaidRef.current;
          const node = ref.current;
          if (!mermaid || !node) return Promise.resolve();
          lastTheme = getTheme();
          // Mermaid replaces innerHTML — restore original chart text before re-render
          node.textContent = chartRef.current;
          // Remove data-processed so mermaid v11 does not skip this node
          node.removeAttribute("data-processed");
          mermaid.initialize({ startOnLoad: false, theme: lastTheme });
          return mermaid.run({ nodes: [node] });
        }).catch((e) => {
          // Warn, not error state — the previously rendered diagram is still on screen
          console.warn("[mermaid] diagram render error:", e);
        });
      }, 200);
    });
    syncObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      cancelled = true;
      if (themeTimer) clearTimeout(themeTimer);
      lazyObserver?.disconnect();
      syncObserver?.disconnect();
    };
  }, [chart]);

  const pan = (dx: number, dy: number) => setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
  const zoom = (factor: number) => setView((v) => ({ ...v, scale: clampScale(v.scale * factor) }));
  const resetView = () => setView({ x: 0, y: 0, scale: 1 });

  // Lock page scroll while the fullscreen lightbox is open
  useEffect(() => {
    if (!fullscreen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [fullscreen]);

  // Onboarding — auto-opens the help panel on first fullscreen entry per
  // page load; the help button re-opens it anytime; collapses on exit so a
  // later entry starts clean (one-time onboarding, not "every entry")
  useEffect(() => {
    if (fullscreen) {
      if (!hintSeen) {
        hintSeen = true;
        setShowHelp(true);
      }
    } else {
      setShowHelp(false);
    }
  }, [fullscreen]);

  // Block native browser gestures (double-tap / pinch / ctrl+wheel zoom).
  // React attaches wheel & touch listeners as passive, so preventDefault
  // needs native non-passive listeners to stop the browser from zooming the
  // whole window while the canvas is in fullscreen.
  useEffect(() => {
    if (!fullscreen || !rendered) return;
    const el = viewportRef.current;
    if (!el) return;
    const blockWheel = (e: WheelEvent) => e.preventDefault();
    const blockTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      // Controls must stay clickable on touch devices
      if (target?.closest("button")) return;
      e.preventDefault();
    };
    el.addEventListener("wheel", blockWheel, { passive: false });
    el.addEventListener("touchstart", blockTouchStart, { passive: false });
    return () => {
      el.removeEventListener("wheel", blockWheel);
      el.removeEventListener("touchstart", blockTouchStart);
    };
  }, [fullscreen, rendered]);

  // Fullscreen shortcuts live on window so ESC (and pan/zoom keys) keep
  // working regardless of which element holds focus after a click.
  useEffect(() => {
    if (!fullscreen) return;
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const actions: Record<string, () => void> = {
        ArrowUp: () => pan(0, -PAN_STEP),
        ArrowDown: () => pan(0, PAN_STEP),
        ArrowLeft: () => pan(-PAN_STEP, 0),
        ArrowRight: () => pan(PAN_STEP, 0),
        "+": () => zoom(ZOOM_STEP),
        "=": () => zoom(ZOOM_STEP),
        "-": () => zoom(1 / ZOOM_STEP),
        "0": resetView,
        Escape: () => setFullscreen(false),
      };
      const action = actions[e.key];
      if (!action) return;
      e.preventDefault();
      action();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fullscreen]);

  // Guard: empty chart
  if (!chart) return null;

  const controlsActive = rendered && fullscreen;
  const showFullscreenBtn = rendered;

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Non-fullscreen: Enter opens fullscreen. Fullscreen shortcuts live on
    // window (see effect above) so they work regardless of focus.
    if (!showFullscreenBtn || controlsActive || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "Enter") {
      e.preventDefault();
      setFullscreen(true);
    }
  };

  if (error) {
    return (
      <div
        className={className}
        style={{
          border: "1px solid hsl(var(--destructive, 0 85% 60%))",
          borderRadius: 8,
          padding: "0.75rem 1rem",
          margin: "1em 0",
        }}
      >
        <p
          style={{
            color: "hsl(var(--destructive, 0 85% 60%))",
            fontWeight: 600,
            marginBottom: 8,
            fontSize: "0.875rem",
          }}
        >
          ⚠️ Diagram rendering error
        </p>
        <pre
          style={{
            fontSize: "0.875rem",
            whiteSpace: "pre-wrap",
            margin: 0,
          }}
        >
          {chart}
        </pre>
      </div>
    );
  }

  return (
    <div
      ref={viewportRef}
      className="max-w-full"
      tabIndex={showFullscreenBtn ? 0 : undefined}
      role={showFullscreenBtn ? "group" : undefined}
      aria-label={
        showFullscreenBtn
          ? fullscreen
            ? "Mermaid diagram. Drag or use arrow keys to pan, + and - to zoom, click the percentage to reset, Esc to exit."
            : "Mermaid diagram. Press Enter to open fullscreen view."
          : undefined
      }
      onKeyDown={handleKeyDown}
      onWheel={controlsActive ? (e) => zoom(e.deltaY > 0 ? 1 / ZOOM_STEP : ZOOM_STEP) : undefined}
      onTouchStart={
        controlsActive
          ? (e) => {
              const t = e.touches[0];
              dragRef.current = { dragging: true, lastX: t.clientX, lastY: t.clientY };
              setIsPanning(true);
            }
          : undefined
      }
      onTouchMove={
        controlsActive
          ? (e) => {
              const d = dragRef.current;
              if (!d.dragging) return;
              const t = e.touches[0];
              pan(t.clientX - d.lastX, t.clientY - d.lastY);
              dragRef.current.lastX = t.clientX;
              dragRef.current.lastY = t.clientY;
            }
          : undefined
      }
      onTouchEnd={
        controlsActive
          ? () => {
              dragRef.current.dragging = false;
              setIsPanning(false);
            }
          : undefined
      }
      onTouchCancel={
        controlsActive
          ? () => {
              dragRef.current.dragging = false;
              setIsPanning(false);
            }
          : undefined
      }
      onMouseDown={
        controlsActive
          ? (e) => {
              dragRef.current = { dragging: true, lastX: e.clientX, lastY: e.clientY };
              setIsPanning(true);
            }
          : undefined
      }
      onMouseMove={
        controlsActive
          ? (e) => {
              const d = dragRef.current;
              if (!d.dragging) return;
              pan(e.clientX - d.lastX, e.clientY - d.lastY);
              dragRef.current.lastX = e.clientX;
              dragRef.current.lastY = e.clientY;
            }
          : undefined
      }
      onMouseUp={
        controlsActive
          ? () => {
              dragRef.current.dragging = false;
              setIsPanning(false);
            }
          : undefined
      }
      onMouseLeave={
        controlsActive
          ? () => {
              dragRef.current.dragging = false;
              setIsPanning(false);
            }
          : undefined
      }
      style={{
        ...(fullscreen
          ? {
              position: "fixed",
              inset: 0,
              zIndex: 50,
              background: "hsl(var(--background, 0 0% 100%))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }
          : { position: "relative" }),
        ...(controlsActive
          ? {
              overflow: "hidden",
              touchAction: "none",
              userSelect: "none",
              cursor: isPanning ? "grabbing" : "grab",
            }
          : { overflow: "auto" }),
      }}
    >
      <div
        style={
          controlsActive
            ? {
                transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
                transformOrigin: "center center",
                transition: isPanning ? "none" : "transform 150ms ease",
              }
            : undefined
        }
      >
        <pre
          ref={ref}
          id={domId}
          className={`mermaid not-prose${className ? ` ${className}` : ""}`}
          style={{ margin: "1em auto", width: "fit-content", maxWidth: "100%" }}
        >
          {chart}
        </pre>
      </div>

      {showFullscreenBtn ? (
        controlsActive ? (
          <div
            role="group"
            aria-label="Pan and zoom controls"
            style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
          >
            {/* Top-right chrome: ESC badge + help toggle, panel drops below */}
            <div
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 8,
                pointerEvents: "auto",
              }}
            >
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  aria-label="Exit full screen"
                  onClick={() => setFullscreen(false)}
                  style={topBarButtonStyle}
                >
                  <kbd
                    style={{
                      padding: "1px 5px",
                      borderRadius: 4,
                      border: "1px solid rgba(127,127,127,0.4)",
                      background: "rgba(127,127,127,0.15)",
                      fontSize: 11,
                      fontFamily: "inherit",
                      lineHeight: 1.4,
                    }}
                  >
                    Esc
                  </kbd>
                  <span>Exit fullscreen</span>
                </button>
                <button
                  type="button"
                  aria-label="Toggle help"
                  aria-expanded={showHelp}
                  title="Canvas controls & keyboard shortcuts"
                  onClick={() => setShowHelp((v) => !v)}
                  style={{ ...topBarButtonStyle, width: 28, padding: 0, fontSize: 14 }}
                >
                  {showHelp ? "×" : "?"}
                </button>
              </div>

              {/* Onboarding / shortcuts — auto-opens once, re-openable via "?" */}
              {showHelp ? (
                <div
                  role="status"
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid rgba(127,127,127,0.25)",
                    background: "rgba(127,127,127,0.12)",
                    backdropFilter: "blur(8px)",
                    color: "currentcolor",
                    fontSize: 12,
                    lineHeight: 1.7,
                    maxWidth: 280,
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 600 }}>Canvas controls</p>
                  <p style={{ margin: 0 }}>Move — hold scroll wheel or tap &amp; drag</p>
                  <p style={{ margin: 0 }}>Zoom — + / − keys or scroll</p>
                  <p style={{ margin: 0 }}>Reset — 0 or click the zoom %</p>
                  <p style={{ margin: 0 }}>Exit — Esc</p>
                </div>
              ) : null}
            </div>

            {/* Zoom bar — minus / percentage-reset / plus */}
            <div
              style={{
                position: "absolute",
                bottom: 16,
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                alignItems: "center",
                gap: 2,
                padding: 4,
                borderRadius: 10,
                border: "1px solid rgba(127,127,127,0.25)",
                background: "rgba(127,127,127,0.12)",
                backdropFilter: "blur(8px)",
                pointerEvents: "auto",
              }}
            >
              <ControlButton
                label="Zoom out"
                onClick={() => zoom(1 / ZOOM_STEP)}
                cell={{ col: 1, row: 1 }}
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4-4M8 11h6" />
              </ControlButton>
              <button
                type="button"
                aria-label="Reset view"
                title="Reset zoom to 100%"
                onClick={resetView}
                style={{
                  minWidth: 56,
                  height: 28,
                  padding: "0 8px",
                  border: "none",
                  borderRadius: 6,
                  background: "transparent",
                  color: "currentcolor",
                  fontSize: 12,
                  fontVariantNumeric: "tabular-nums",
                  cursor: "pointer",
                }}
              >
                {Math.round(view.scale * 100)}%
              </button>
              <ControlButton
                label="Zoom in"
                onClick={() => zoom(ZOOM_STEP)}
                cell={{ col: 3, row: 1 }}
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4-4M8 11h6M11 8v6" />
              </ControlButton>
            </div>
          </div>
        ) : (
          <div style={{ position: "absolute", bottom: 8, right: 8 }}>
            <ControlButton
              label="Enter full screen"
              onClick={() => setFullscreen(true)}
              cell={{ col: 1, row: 1 }}
            >
              <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
            </ControlButton>
          </div>
        )
      ) : null}
    </div>
  );
}
