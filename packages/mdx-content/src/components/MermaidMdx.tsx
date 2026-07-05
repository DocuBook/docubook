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

interface MermaidMdxProps {
  /** Mermaid diagram definition (from rehype plugin or programmatic) */
  chart: string;
  /** Custom DOM id (auto-generated if omitted) */
  id?: string;
  /** Additional CSS class on container */
  className?: string;
  /** Show GFM-style pan/zoom controls once the diagram renders (default true) */
  panZoom?: boolean;
}

function getTheme(): "dark" | "default" {
  return document.documentElement.classList.contains("dark") ? "dark" : "default";
}

// Pan/zoom tuning — button-driven like GFM's mermaid viewer (no drag/wheel)
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

export function MermaidMdx({ chart, id, className, panZoom = true }: MermaidMdxProps) {
  const generatedId = useId();
  const domId = id ?? `mermaid-${generatedId.replace(/[:.]/g, "-")}`;
  const ref = useRef<HTMLPreElement>(null);
  const chartRef = useRef(chart);
  const mermaidRef = useRef<Mermaid | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rendered, setRendered] = useState(false);
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const [fullscreen, setFullscreen] = useState(false);

  // Keep chartRef in sync so theme-change re-render (T-005) can restore text
  chartRef.current = chart;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!chart) return;

    let cancelled = false;
    let lazyObserver: IntersectionObserver | null = null;
    let syncObserver: MutationObserver | null = null;
    let themeTimer: ReturnType<typeof setTimeout> | null = null;

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
            Promise.resolve(mermaid.run({ nodes: [ref.current] }))
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
        // Mermaid replaces innerHTML — restore original chart text before re-render
        ref.current.textContent = chartRef.current;
        // Remove data-processed so mermaid v11 does not skip this node
        ref.current.removeAttribute("data-processed");
        mermaidRef.current.initialize({
          startOnLoad: false,
          theme: getTheme(),
        });
        mermaidRef.current.run({ nodes: [ref.current] });
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
    // chart string is static from MDX — this only fires on mount
  }, []);

  // Lock page scroll while the fullscreen lightbox is open
  useEffect(() => {
    if (!fullscreen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [fullscreen]);

  // Guard: empty chart
  if (!chart) return null;

  const pan = (dx: number, dy: number) => setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
  const zoom = (factor: number) => setView((v) => ({ ...v, scale: clampScale(v.scale * factor) }));
  const resetView = () => setView({ x: 0, y: 0, scale: 1 });

  const controlsActive = panZoom && rendered;

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Leave browser shortcuts (Ctrl/Cmd+0, Ctrl/Cmd+-, Alt+arrows, ...) alone
    if (!controlsActive || e.ctrlKey || e.metaKey || e.altKey) return;
    const actions: Record<string, () => void> = {
      ArrowUp: () => pan(0, -PAN_STEP),
      ArrowDown: () => pan(0, PAN_STEP),
      ArrowLeft: () => pan(-PAN_STEP, 0),
      ArrowRight: () => pan(PAN_STEP, 0),
      "+": () => zoom(ZOOM_STEP),
      "=": () => zoom(ZOOM_STEP),
      "-": () => zoom(1 / ZOOM_STEP),
      "0": resetView,
      ...(fullscreen ? { Escape: () => setFullscreen(false) } : {}),
    };
    const action = actions[e.key];
    if (!action) return;
    e.preventDefault();
    action();
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
      className="max-w-full"
      tabIndex={controlsActive ? 0 : undefined}
      role={controlsActive ? "group" : undefined}
      aria-label={
        controlsActive
          ? "Mermaid diagram. Use arrow keys to pan, + and - to zoom, 0 to reset."
          : undefined
      }
      onKeyDown={handleKeyDown}
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
        ...(controlsActive ? { overflow: "hidden" } : { overflowX: "auto" }),
      }}
    >
      <div
        style={
          controlsActive
            ? {
                transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
                transformOrigin: "center center",
                transition: "transform 150ms ease",
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

      {controlsActive ? (
        <div
          role="group"
          aria-label="Pan and zoom controls"
          style={{
            position: "absolute",
            bottom: 8,
            right: 8,
            display: "grid",
            gridTemplateColumns: "repeat(3, 28px)",
            gap: 4,
          }}
        >
          <ControlButton
            label={fullscreen ? "Exit full screen" : "Enter full screen"}
            onClick={() => setFullscreen((f) => !f)}
            cell={{ col: 1, row: 1 }}
          >
            {fullscreen ? (
              <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" />
            ) : (
              <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
            )}
          </ControlButton>
          <ControlButton label="Pan up" onClick={() => pan(0, -PAN_STEP)} cell={{ col: 2, row: 1 }}>
            <path d="m18 15-6-6-6 6" />
          </ControlButton>
          <ControlButton label="Zoom in" onClick={() => zoom(ZOOM_STEP)} cell={{ col: 3, row: 1 }}>
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4-4M8 11h6M11 8v6" />
          </ControlButton>
          <ControlButton
            label="Pan left"
            onClick={() => pan(-PAN_STEP, 0)}
            cell={{ col: 1, row: 2 }}
          >
            <path d="m15 18-6-6 6-6" />
          </ControlButton>
          <ControlButton label="Reset view" onClick={resetView} cell={{ col: 2, row: 2 }}>
            <path d="M3 12a9 9 0 1 0 2.6-6.3L3 8" />
            <path d="M3 3v5h5" />
          </ControlButton>
          <ControlButton
            label="Pan right"
            onClick={() => pan(PAN_STEP, 0)}
            cell={{ col: 3, row: 2 }}
          >
            <path d="m9 18 6-6-6-6" />
          </ControlButton>
          <ControlButton
            label="Pan down"
            onClick={() => pan(0, PAN_STEP)}
            cell={{ col: 2, row: 3 }}
          >
            <path d="m6 9 6 6 6-6" />
          </ControlButton>
          <ControlButton
            label="Zoom out"
            onClick={() => zoom(1 / ZOOM_STEP)}
            cell={{ col: 3, row: 3 }}
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4-4M8 11h6" />
          </ControlButton>
        </div>
      ) : null}
    </div>
  );
}
