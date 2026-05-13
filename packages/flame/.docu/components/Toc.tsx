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
  const observerRef = useRef<IntersectionObserver | null>(null);
  const clickedIdRef = useRef<string | null>(null);
  const activeIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    if (typeof document === "undefined" || !tocs.length) return;

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      if (clickedIdRef.current) return;

      const visibleEntries = entries.filter((entry) => entry.isIntersecting);
      if (!visibleEntries.length) return;

      const mostVisibleEntry = visibleEntries.reduce((prev, current) => {
        return current.intersectionRatio > prev.intersectionRatio ? current : prev;
      }, visibleEntries[0]);

      const newActiveId = mostVisibleEntry.target.id;
      if (newActiveId !== activeIdRef.current) {
        setActiveId(newActiveId);
      }
    };

    const isDesktop = window.innerWidth >= 1024;
    const container = isDesktop ? document.getElementById("scroll-container") : null;

    observerRef.current = new IntersectionObserver(handleIntersect, {
      root: container,
      rootMargin: isDesktop ? "0px 0px -60% 0px" : "-160px 0px -60% 0px",
      threshold: 0,
    });

    tocs.forEach((toc) => {
      const element = document.getElementById(toc.href.slice(1));
      if (element) {
        observerRef.current?.observe(element);
      }
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [tocs]);

  const handleLinkClick = useCallback((id: string) => {
    clickedIdRef.current = id;
    setActiveId(id);

    const timer = setTimeout(() => {
      clickedIdRef.current = null;
    }, 1000);

    return () => clearTimeout(timer);
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
          <div className="bg-base-300 absolute top-0 left-0 h-full w-px" />

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
                    <span className="line-clamp-2 text-sm break-words">{text}</span>
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
