import { useCallback, useEffect, useRef, useState } from "react";
import type { TocItem } from "../node/types";
import { revealScrollTop } from "./toc-list-scroll";

interface TocDotsProps {
  tocs: TocItem[];
  activeId: string | null;
  onNavigate: (id: string) => void;
}

export function TocDots({ tocs, activeId, onNavigate }: TocDotsProps) {
  const navRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ text: string; top: number } | null>(null);

  // Keep only the dot list in view. Scrolling the document belongs to the
  // heading links, so an active-state update cannot move the reading pane.
  const revealActive = useCallback(() => {
    const track = trackRef.current;
    const active = track?.querySelector<HTMLElement>('[aria-current="location"]');
    if (!track || !active || !track.clientHeight) return;
    const top = revealScrollTop(
      {
        top: track.getBoundingClientRect().top + track.clientTop,
        height: track.clientHeight,
        scrollTop: track.scrollTop,
        scrollHeight: track.scrollHeight,
      },
      { top: active.getBoundingClientRect().top, height: active.clientHeight },
      "nearest"
    );
    if (top !== null) track.scrollTop = top;
  }, []);

  useEffect(revealActive, [activeId, revealActive]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new ResizeObserver(revealActive);
    observer.observe(track);
    return () => observer.disconnect();
  }, [revealActive]);

  const showTooltip = (link: HTMLAnchorElement, text: string) => {
    const nav = navRef.current;
    if (!nav) return;
    const rect = link.getBoundingClientRect();
    const bounds = nav.getBoundingClientRect();
    setTooltip({
      text,
      top: Math.max(32, Math.min(bounds.height - 32, rect.top + rect.height / 2 - bounds.top)),
    });
  };

  return (
    <nav ref={navRef} className="toc-dots" aria-label="Page sections">
      <div
        ref={trackRef}
        className="toc-dots-track"
        onScroll={() => {
          const focused = document.activeElement;
          const track = trackRef.current;
          if (focused instanceof HTMLAnchorElement && track?.contains(focused)) {
            const rect = focused.getBoundingClientRect();
            const bounds = track.getBoundingClientRect();
            if (rect.top >= bounds.top && rect.bottom <= bounds.bottom) {
              showTooltip(focused, focused.getAttribute("aria-label") || "");
              return;
            }
          }
          setTooltip(null);
        }}
      >
        {tocs.map((toc) => (
          <a
            key={toc.href}
            href={toc.href}
            className="toc-dot-link"
            aria-label={toc.text}
            aria-current={toc.href.slice(1) === activeId ? "location" : undefined}
            onMouseEnter={(event) => showTooltip(event.currentTarget, toc.text)}
            onMouseLeave={() => setTooltip(null)}
            onFocus={(event) => showTooltip(event.currentTarget, toc.text)}
            onBlur={() => setTooltip(null)}
            onKeyDown={(event) => {
              if (event.key === "Escape" && tooltip) {
                event.stopPropagation();
                setTooltip(null);
              }
            }}
            onClick={(event) => {
              event.preventDefault();
              onNavigate(toc.href.slice(1));
              setTooltip(null);
            }}
          >
            <span className="toc-dot" aria-hidden="true" />
          </a>
        ))}
      </div>
      {tooltip && (
        <div role="tooltip" className="toc-dots-tooltip" style={{ top: tooltip.top }}>
          {tooltip.text}
        </div>
      )}
    </nav>
  );
}
