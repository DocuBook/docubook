"use client";

import clsx from "clsx";
import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ScrollToTop } from "./scroll-to-top";
import { TocItem } from "@/lib/toc";

interface TocObserverProps {
  data: TocItem[];
  activeId?: string | null;
  onActiveIdChange?: (id: string | null) => void;
}

export default function TocObserver({
  data,
  activeId: externalActiveId,
  onActiveIdChange
}: TocObserverProps) {
  const [internalActiveId, setInternalActiveId] = useState<string | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const [clickedId, setClickedId] = useState<string | null>(null);
  const itemRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());

  // Use external activeId if provided, otherwise use internal state
  const activeId = externalActiveId !== undefined ? externalActiveId : internalActiveId;
  const setActiveId = onActiveIdChange || setInternalActiveId;

  // Handle intersection observer for auto-highlighting
  useEffect(() => {
    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      const visibleEntries = entries.filter(entry => entry.isIntersecting);

      // Find the most recently scrolled-into-view element
      const mostVisibleEntry = visibleEntries.reduce((prev, current) => {
        // Prefer the entry that's more visible or higher on the page
        const prevRatio = prev?.intersectionRatio || 0;
        const currentRatio = current.intersectionRatio;

        if (currentRatio > prevRatio) return current;
        if (currentRatio === prevRatio &&
            current.boundingClientRect.top < prev.boundingClientRect.top) {
          return current;
        }
        return prev;
      }, visibleEntries[0]);

      if (mostVisibleEntry && !clickedId) {
        const newActiveId = mostVisibleEntry.target.id;
        if (newActiveId !== activeId) {
          setActiveId(newActiveId);
        }
      }
    };

    observer.current = new IntersectionObserver(handleIntersect, {
      root: null,
      rootMargin: "-20% 0px -70% 0px", // Adjusted margins for better section detection
      threshold: [0, 0.1, 0.5, 0.9, 1], // Multiple thresholds for better accuracy
    });

    const elements = data.map((item) =>
      document.getElementById(item.href.slice(1))
    );

    elements.forEach((el) => {
      if (el && observer.current) {
        observer.current.observe(el);
      }
    });

    // Set initial active ID if none is set
    if (!activeId && elements[0]) {
      setActiveId(elements[0].id);
    }

    return () => {
      if (observer.current) {
        elements.forEach((el) => {
          if (el) {
            observer.current!.unobserve(el);
          }
        });
      }
    };
  }, [data, clickedId, activeId, setActiveId]);

  const handleLinkClick = useCallback((id: string) => {
    setClickedId(id);
    setActiveId(id);

    // Reset the clicked state after a delay to allow for smooth scrolling
    const timer = setTimeout(() => {
      setClickedId(null);
    }, 1000);

    return () => clearTimeout(timer);
  }, [setActiveId]);

  // Function to check if an item has children
  const hasChildren = (currentId: string, currentLevel: number) => {
    const currentIndex = data.findIndex(item => item.href.slice(1) === currentId);
    if (currentIndex === -1 || currentIndex === data.length - 1) return false;

    const nextItem = data[currentIndex + 1];
    return nextItem.level > currentLevel;
  };

  // Calculate scroll progress for the active section
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!activeId) return;

      const activeElement = document.getElementById(activeId);
      if (!activeElement) return;

      const rect = activeElement.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const elementTop = rect.top;
      const elementHeight = rect.height;

      // Calculate how much of the element is visible
      let progress = 0;
      if (elementTop < windowHeight) {
        progress = Math.min(1, (windowHeight - elementTop) / (windowHeight + elementHeight));
      }

      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeId]);


  return (
    <div className="relative">
      <div className="relative text-sm text-foreground/70 hover:text-foreground transition-colors">
        <div className="flex flex-col gap-0">
          {data.map(({ href, level, text }, index) => {
            const id = href.slice(1);
            const isActive = activeId === id;
            const indent = level > 1 ? (level - 1) * 20 : 0;
            // Prefix with underscore to indicate intentionally unused
            const _isParent = hasChildren(id, level);
            const _isLastInLevel = index === data.length - 1 || data[index + 1].level <= level;

            return (
              <div key={href} className="relative">
                {/* Simple L-shaped connector */}
                {level > 1 && (
                  <div
                    className={clsx("absolute top-0 h-full w-6", {
                      "left-[6px]": indent === 20, // Level 2
                      "left-[22px]": indent === 40, // Level 3
                      "left-[38px]": indent === 60, // Level 4
                    })}
                  >
                    {/* Vertical line */}
                    <div className={clsx(
                      "absolute left-0 top-0 h-full w-px",
                      isActive ? "bg-primary/20 dark:bg-primary/30" : "bg-border/50 dark:bg-border/50"
                    )}>
                      {isActive && (
                        <motion.div
                          className="absolute left-0 top-0 w-full h-full bg-primary origin-top"
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: scrollProgress }}
                          transition={{ duration: 0.3 }}
                        />
                      )}
                    </div>

                    {/* Horizontal line */}
                    <div className={clsx(
                      "absolute left-0 top-1/2 h-px w-6",
                      isActive ? "bg-primary/20 dark:bg-primary/30" : "bg-border/50 dark:bg-border/50"
                    )}>
                      {isActive && (
                        <motion.div
                          className="absolute left-0 top-0 h-full w-full bg-primary dark:bg-accent origin-left"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: scrollProgress }}
                          transition={{ duration: 0.3, delay: 0.1 }}
                        />
                      )}
                    </div>
                  </div>
                )}

                <Link
                  href={href}
                  onClick={() => handleLinkClick(id)}
                  className={clsx(
                    "relative flex items-center py-2 transition-colors",
                    {
                      "text-primary dark:text-primary font-medium": isActive,
                      "text-muted-foreground hover:text-foreground dark:hover:text-foreground/90": !isActive,
                    }
                  )}
                  style={{
                    paddingLeft: `${indent}px`,
                    marginLeft: level > 1 ? '12px' : '0',
                  }}
                  ref={(el) => {
                    const map = itemRefs.current;
                    if (el) {
                      map.set(id, el);
                    } else {
                      map.delete(id);
                    }
                  }}
                >
                  {/* Circle indicator */}
                  <div className="relative w-4 h-4 flex items-center justify-center flex-shrink-0">
                    <div className={clsx(
                      "w-1.5 h-1.5 rounded-full transition-all duration-300 relative z-10",
                      {
                        "bg-primary scale-100 dark:bg-primary/90": isActive,
                        "bg-muted-foreground/30 dark:bg-muted-foreground/30 scale-75 group-hover:scale-100 group-hover:bg-primary/50 dark:group-hover:bg-primary/50": !isActive,
                      }
                    )}>
                      {isActive && (
                        <motion.div
                          className="absolute inset-0 rounded-full bg-primary/20 dark:bg-primary/30"
                          initial={{ scale: 1 }}
                          animate={{ scale: 1.8 }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatType: "reverse"
                          }}
                        />
                      )}
                    </div>
                  </div>

                  <span className="truncate text-sm">
                    {text}
                  </span>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
      {/* Add scroll to top link at the bottom of TOC */}
      <ScrollToTop className="mt-6" />
    </div>
  );
}
