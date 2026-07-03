"use client";

import { useId, useRef, useEffect, useState } from "react";
import type { Mermaid } from "mermaid";

// ponytail: module-level singleton — one dynamic import regardless of diagram count
let mermaidPromise: Promise<typeof import("mermaid")> | null = null;

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

export function MermaidMdx({ chart, id, className }: MermaidMdxProps) {
  const generatedId = useId();
  const domId = id ?? `mermaid-${generatedId.replace(/[:.]/g, "-")}`;
  const ref = useRef<HTMLPreElement>(null);
  const chartRef = useRef(chart);
  const mermaidRef = useRef<Mermaid | null>(null);
  const [error, setError] = useState<string | null>(null);

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
            mermaid.run({ nodes: [ref.current] });
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
    // ponytail: chart string is static from MDX — this only fires on mount
  }, []);

  // Guard: empty chart
  if (!chart) return null;

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
    <div className="max-w-full overflow-x-auto">
      <pre
        ref={ref}
        id={domId}
        className={`mermaid not-prose${className ? ` ${className}` : ""}`}
        style={{ margin: "1em 0" }}
      >
        {chart}
      </pre>
    </div>
  );
}
