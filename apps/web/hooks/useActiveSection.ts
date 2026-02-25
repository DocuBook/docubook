import { useState, useCallback, useEffect, useRef } from 'react';
import { TocItem } from '@/lib/toc';

export function useActiveSection(tocs: TocItem[]) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const clickedIdRef = useRef<string | null>(null);

  // Handle intersection observer for active section
  useEffect(() => {
    if (typeof document === 'undefined' || !tocs.length) return;

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      if (clickedIdRef.current) return;

      const visibleEntries = entries.filter(entry => entry.isIntersecting);
      if (!visibleEntries.length) return;

      // Find the most visible entry
      const mostVisibleEntry = visibleEntries.reduce((prev, current) => {
        return current.intersectionRatio > prev.intersectionRatio ? current : prev;
      }, visibleEntries[0]);

      const newActiveId = mostVisibleEntry.target.id;
      if (newActiveId !== activeId) {
        setActiveId(newActiveId);
      }
    };

    // Initialize intersection observer
    observerRef.current = new IntersectionObserver(handleIntersect, {
      root: null,
      rootMargin: '0px 0px -80% 0px',
      threshold: 0.1,
    });

    // Observe all headings
    tocs.forEach(toc => {
      const element = document.getElementById(toc.href.slice(1));
      if (element) {
        observerRef.current?.observe(element);
      }
    });

    // Cleanup
    return () => {
      observerRef.current?.disconnect();
    };
  }, [tocs, activeId]);

  const handleLinkClick = useCallback((id: string) => {
    clickedIdRef.current = id;
    setActiveId(id);

    // Reset clicked state after scroll completes
    const timer = setTimeout(() => {
      clickedIdRef.current = null;
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return {
    activeId,
    setActiveId,
    handleLinkClick,
  };
}
