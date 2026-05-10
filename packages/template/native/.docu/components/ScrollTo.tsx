"use client";

import { ArrowUpIcon } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { cn } from "../lib/utils";

interface ScrollToProps {
  className?: string;
  showIcon?: boolean;
  offset?: number;
}

export function ScrollTo({ className, showIcon = true, offset = 0 }: ScrollToProps) {
  const [isVisible, setIsVisible] = useState(false);

  const checkScroll = useCallback(() => {
    const container = document.getElementById("scroll-container");
    const scrollY = container ? container.scrollTop : window.scrollY;

    const halfViewportHeight = window.innerHeight * 0.5;
    const scrolledPastHalfViewport = scrollY > halfViewportHeight + offset;

    if (scrolledPastHalfViewport !== isVisible) {
      setIsVisible(scrolledPastHalfViewport);
    }
  }, [isVisible, offset]);

  useEffect(() => {
    checkScroll();

    let timeoutId: ReturnType<typeof setTimeout>;
    const handleScroll = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(checkScroll, 100);
    };

    const container = document.getElementById("scroll-container") || window;
    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [checkScroll]);

  const scrollToTop = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const container = document.getElementById("scroll-container");
    if (container) {
      container.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  return (
    <div
      className={cn(
        "border-base-300 mt-4 border-t pt-4",
        "transition-opacity duration-300",
        "opacity-100",
        className
      )}
    >
      <a
        href="#"
        onClick={scrollToTop}
        className={cn(
          "inline-flex items-center text-sm",
          "link link-hover text-base-content/60 hover:text-base-content",
          "transition-all duration-200 hover:translate-y-px"
        )}
        aria-label="Scroll to top"
      >
        {showIcon && <ArrowUpIcon className="mr-1 h-3.5 w-3.5 shrink-0" />}
        <span>Scroll to Top</span>
      </a>
    </div>
  );
}
