"use client";

import { ArrowUpIcon } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ScrollToTopProps {
  className?: string;
  showIcon?: boolean;
  offset?: number; // Optional offset in pixels from the trigger point
}

export function ScrollToTop({
  className,
  showIcon = true,
  offset = 0
}: ScrollToTopProps) {
  const [isVisible, setIsVisible] = useState(false);

  const checkScroll = useCallback(() => {
    // Calculate 50% of viewport height
    const halfViewportHeight = window.innerHeight * 0.5;
    // Check if scrolled past half viewport height (plus any offset)
    const scrolledPastHalfViewport = window.scrollY > (halfViewportHeight + offset);

    // Only update state if it changes to prevent unnecessary re-renders
    if (scrolledPastHalfViewport !== isVisible) {
      setIsVisible(scrolledPastHalfViewport);
    }
  }, [isVisible, offset]);

  useEffect(() => {
    // Initial check
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkScroll();

    // Set up scroll listener with debounce for better performance
    let timeoutId: NodeJS.Timeout;
    const handleScroll = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(checkScroll, 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [checkScroll]);

  const scrollToTop = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "mt-4 pt-4 border-t border-stone-200 dark:border-stone-800",
        "transition-opacity duration-300",
        isVisible ? 'opacity-100' : 'opacity-0',
        className
      )}
    >
      <Link
        href="#"
        onClick={scrollToTop}
        className={cn(
          "inline-flex items-center text-sm text-muted-foreground hover:text-foreground",
          "transition-all duration-200 hover:translate-y-[-1px]"
        )}
        aria-label="Scroll to top"
      >
        {showIcon && <ArrowUpIcon className="mr-1 h-3.5 w-3.5 flex-shrink-0" />}
        <span>Scroll to Top</span>
      </Link>
    </div>
  );
}
