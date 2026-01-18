"use client";

import { List, ChevronDown, ChevronUp } from "lucide-react";
import TocObserver from "./toc-observer";
import * as React from "react";
import { useRef, useMemo } from "react";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useActiveSection } from "@/hooks";
import { TocItem } from "@/lib/toc";

interface MobTocProps {
  tocs: TocItem[];
}

const useClickOutside = (ref: React.RefObject<HTMLElement | null>, callback: () => void) => {
  const handleClick = React.useCallback((event: MouseEvent) => {
    if (ref.current && !ref.current.contains(event.target as Node)) {
      callback();
    }
  }, [ref, callback]);

  React.useEffect(() => {
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, [handleClick]);
};

export default function MobToc({ tocs }: MobTocProps) {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = React.useState(false);
  const tocRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Use custom hooks
  const { activeId, setActiveId } = useActiveSection(tocs);

  // Only show on /docs pages
  const isDocsPage = useMemo(() => pathname?.startsWith('/docs'), [pathname]);

  // Toggle expanded state
  const toggleExpanded = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(prev => !prev);
  }, []);

  // Close TOC when clicking outside
  useClickOutside(tocRef, () => {
    if (isExpanded) {
      setIsExpanded(false);
    }
  });

  // Handle body overflow when TOC is expanded
  React.useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isExpanded]);

  // Don't render anything if not on docs page or no TOC items
  if (!isDocsPage || !tocs?.length) return null;

  const chevronIcon = isExpanded ? (
    <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
  ) : (
    <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
  );

  return (
    <AnimatePresence>
        <motion.div
          ref={tocRef}
          className="lg:hidden fixed top-16 left-0 right-0 z-50"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          <div className="w-full bg-background/95 backdrop-blur-sm border-b border-stone-200 dark:border-stone-800 shadow-sm">
            <div className="sm:px-8 px-4 py-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between h-auto py-2 px-2 -mx-1 rounded-md hover:bg-transparent hover:text-inherit"
                onClick={toggleExpanded}
                aria-label={isExpanded ? 'Collapse table of contents' : 'Expand table of contents'}
              >
                <div className="flex items-center gap-2">
                  <List className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium text-sm">On this page</span>
                </div>
                {chevronIcon}
              </Button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    ref={contentRef}
                    className="mt-2 pb-2 max-h-[60vh] overflow-y-auto px-1 -mx-1"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                  >
                    <TocObserver
                      data={tocs}
                      activeId={activeId}
                      onActiveIdChange={setActiveId}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
    </AnimatePresence>
  );
}
