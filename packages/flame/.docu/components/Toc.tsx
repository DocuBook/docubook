"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ListIcon } from "lucide-react";
import { cn } from "../node/utils";
import { ScrollTo } from "./ScrollTo";
import { TocItem } from "../node/types";
import { TocDots } from "./TocDots";

interface TocProps {
  tocs: TocItem[];
}

export default function Toc({ tocs }: TocProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const clickedIdRef = useRef<string | null>(null);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const activeIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  // Single source of truth for the anchor offset — used by BOTH the scroll
  // observer and the TOC click scroll so they can never disagree. Reads the
  // CSS scroll-margin-top (prose-headings:scroll-mt-4 desktop /
  // scroll-mt-16 mobile) so a change in one place updates both, and the
  // heading lands exactly where the browser would put a native anchor jump.
  const getAnchorOffset = useCallback((): number => {
    if (typeof window === "undefined") return 100;
    const first = tocs[0] ? document.getElementById(tocs[0].href.slice(1)) : null;
    const margin = first ? parseFloat(getComputedStyle(first).scrollMarginTop) : 0;
    return margin || 100;
  }, [tocs]);

  useEffect(() => {
    // Desktop-only TOC — on mobile this island is display:none but still
    // mounted; letting its observer run would hijack the URL hash while the
    // mobile bar owns TOC behavior there.
    if (typeof window === "undefined") return;
    if (!tocs.length) return;

    const container = document.getElementById("scroll-container");
    const scrollTarget = container || window;

    const handleScroll = () => {
      if (window.innerWidth < 1024) return;
      if (clickedIdRef.current) return;
      const offset = getAnchorOffset();

      let currentId: string | null = null;
      for (const toc of tocs) {
        const id = toc.href.slice(1);
        const el = document.getElementById(id);
        if (!el) continue;

        const top = el.getBoundingClientRect().top - (container?.getBoundingClientRect().top ?? 0);

        if (top <= offset) {
          currentId = id;
        } else {
          break;
        }
      }

      if (
        container &&
        container.scrollHeight > container.clientHeight &&
        container.scrollTop + container.clientHeight >= container.scrollHeight - 1
      ) {
        currentId = tocs[tocs.length - 1].href.slice(1);
      }

      if (currentId !== activeIdRef.current) {
        setActiveId(currentId);
        history.replaceState(null, "", currentId ? `#${currentId}` : "#top");
      }
    };

    handleScroll(); // set initial active on mount

    let throttleTimer: ReturnType<typeof setTimeout> | null = null;
    const listener =
      tocs.length > 30
        ? () => {
            if (throttleTimer) return;
            throttleTimer = setTimeout(() => {
              throttleTimer = null;
              handleScroll();
            }, 50);
          }
        : handleScroll;

    scrollTarget.addEventListener("scroll", listener, { passive: true });
    window.addEventListener("resize", listener);
    const resize = container ? new ResizeObserver(listener) : null;
    if (container) resize?.observe(container);

    return () => {
      scrollTarget.removeEventListener("scroll", listener);
      window.removeEventListener("resize", listener);
      resize?.disconnect();
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [tocs, getAnchorOffset]);

  const handleLinkClick = useCallback((id: string) => {
    clickedIdRef.current = id;
    setActiveId(id);
    history.replaceState(null, "", `#${id}`);
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => {
      clickedIdRef.current = null;
    }, 1000);
  }, []);

  const handleScrollToTop = useCallback(() => {
    clickedIdRef.current = "__top__";
    setActiveId(null);
    history.replaceState(null, "", "#top");
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => {
      clickedIdRef.current = null;
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    };
  }, []);

  const activeItemRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeId && activeItemRef.current?.offsetParent && !clickedIdRef.current) {
      activeItemRef.current.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [activeId]);

  if (!tocs.length) return null;

  const navigateToHeading = (id: string) => {
    handleLinkClick(id);
    const element = document.getElementById(id);
    if (!element) return;
    const scroller = window.innerWidth >= 1024 ? document.getElementById("scroll-container") : null;
    const offset = getAnchorOffset();
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth";
    if (scroller) {
      scroller.scrollTo({
        top:
          element.getBoundingClientRect().top -
          scroller.getBoundingClientRect().top +
          scroller.scrollTop -
          offset,
        behavior,
      });
    } else {
      window.scrollTo({
        top: element.getBoundingClientRect().top + window.scrollY - offset,
        behavior,
      });
    }
  };

  return (
    <>
      <div className="toc-full flex h-full min-h-0 w-full flex-col gap-2">
        <div className="flex shrink-0 items-center gap-2">
          <ListIcon className="h-4 w-4" />
          <h3 className="text-sm font-medium">On this page</h3>
        </div>

        <div className="relative min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="relative text-sm">
            <div className="bg-base-300 absolute top-0 left-0 h-full w-px" />

            <div className="flex flex-col">
              {tocs.map(({ href, level, text }) => {
                const id = href.slice(1);
                const isActive = activeId === id;
                const levelPadding = (level - 2) * 16;

                return (
                  <div
                    key={href}
                    ref={isActive ? activeItemRef : undefined}
                    className={cn(
                      "relative flex items-center transition-all duration-200",
                      isActive && "bg-primary/5"
                    )}
                  >
                    <div
                      className={cn(
                        "flex shrink-0 items-center px-1 py-2 transition-all duration-200",
                        isActive && "border-primary -ml-px border-l-[3px]"
                      )}
                    >
                      <div
                        className={cn(
                          "h-px transition-colors duration-200",
                          isActive ? "bg-primary w-3" : "bg-base-300 w-2"
                        )}
                      />
                      <div
                        className={cn(
                          "h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-300",
                          isActive ? "bg-primary" : "bg-base-300"
                        )}
                      />
                    </div>

                    <a
                      href={href}
                      onClick={(e) => {
                        e.preventDefault();
                        navigateToHeading(id);
                      }}
                      className={cn(
                        "flex flex-1 items-center py-2 transition-all duration-200",
                        isActive
                          ? "text-primary font-medium"
                          : "text-base-content/60 hover:text-base-content"
                      )}
                      style={{ paddingLeft: `${levelPadding + 6}px` }}
                    >
                      <span className="line-clamp-2 text-sm break-words">{text}</span>
                    </a>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-2 grid grid-cols-[28px_minmax(0,1fr)] items-start px-4 text-sm">
            <div aria-hidden="true" />
            <ScrollTo className="mt-0" onScrollToTop={handleScrollToTop} />
          </div>
        </div>
      </div>
      <TocDots tocs={tocs} activeId={activeId} onNavigate={navigateToHeading} />
    </>
  );
}
