"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ListIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { ScrollTo } from "./ScrollTo";
import { TocItem } from "../lib/types";

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

  useEffect(() => {
    if (typeof document === "undefined" || !tocs.length) return;

    const isDesktop = window.innerWidth >= 1024;
    const container = isDesktop ? document.getElementById("scroll-container") : null;
    const scrollTarget = container || window;
    const offset = isDesktop ? 80 : 100;

    const handleScroll = () => {
      if (clickedIdRef.current) return;

      let currentId: string | null = null;
      for (const toc of tocs) {
        const id = toc.href.slice(1);
        const el = document.getElementById(id);
        if (!el) continue;

        const top = container ? el.offsetTop - container.scrollTop : el.getBoundingClientRect().top;

        if (top <= offset) {
          currentId = id;
        } else {
          break;
        }
      }

      if (currentId && currentId !== activeIdRef.current) {
        setActiveId(currentId);
        history.replaceState(null, "", `#${currentId}`);
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

    return () => {
      scrollTarget.removeEventListener("scroll", listener);
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [tocs]);

  const handleLinkClick = useCallback((id: string) => {
    clickedIdRef.current = id;
    setActiveId(id);
    history.replaceState(null, "", `#${id}`);
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

  if (!tocs.length) return null;

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center gap-2">
        <ListIcon className="h-4 w-4" />
        <h3 className="text-sm font-medium">On this page</h3>
      </div>

      <div className="relative">
        <div className="relative text-sm">
          <div className="bg-base-300 absolute left-0 top-0 h-full w-px" />

          <div className="flex flex-col">
            {tocs.map(({ href, level, text }) => {
              const id = href.slice(1);
              const isActive = activeId === id;
              const levelPadding = (level - 2) * 16;

              return (
                <div
                  key={href}
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
                      handleLinkClick(id);
                      const el = document.getElementById(id);
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                    className={cn(
                      "flex flex-1 items-center py-2 transition-all duration-200",
                      isActive
                        ? "text-primary font-medium"
                        : "text-base-content/60 hover:text-base-content"
                    )}
                    style={{ paddingLeft: `${levelPadding + 6}px` }}
                  >
                    <span className="line-clamp-2 break-words text-sm">{text}</span>
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <ScrollTo className="mt-2" />
    </div>
  );
}
