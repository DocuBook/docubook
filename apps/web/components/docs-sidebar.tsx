"use client";

import { ChevronDown, ChevronUp, PanelRight } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "@/components/navbar";
import DocsMenu from "@/components/docs-menu";
import { ModeToggle } from "@/components/ThemeToggle";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ContextPopover from "@/components/ContextPopover";
import TocObserver from "./toc-observer";
import * as React from "react";
import { useRef, useMemo } from "react";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useActiveSection } from "@/hooks";
import { TocItem } from "@/lib/toc";
import Search from "@/components/Search";

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

  // Get title from path segment (last part of URL)
  const pageTitle = pathname?.split('/').filter(Boolean).pop() || '';

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

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

  // Don't render anything if not on docs page
  if (!isDocsPage || !mounted) return null;

  const chevronIcon = isExpanded ? (
    <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
  ) : (
    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
  );

  return (
    <AnimatePresence>
      <motion.div
        ref={tocRef}
        className="lg:hidden sticky top-0 z-50 -mx-4 -mt-4 mb-4"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      >
        <div className="w-full bg-background/95 backdrop-blur-sm border-b border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="p-2">
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="max-lg:flex hidden">
                    <PanelRight className="w-5 h-5 shrink-0" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="flex flex-col gap-4 px-0" side="left">
                  <DialogTitle className="sr-only">Navigation Menu</DialogTitle>
                  <DialogDescription className="sr-only">
                    Main navigation menu with links to different sections
                  </DialogDescription>
                  <SheetHeader>
                    <SheetClose className="px-4" asChild>
                      <div className="flex items-center justify-start gap-16">
                        <span className="px-2"><Logo /></span>
                        <ModeToggle />
                      </div>
                    </SheetClose>
                  </SheetHeader>
                  <div className="flex flex-col gap-4 overflow-y-auto">
                    <div className="mx-2 px-5 space-y-2">
                      <ContextPopover />
                      <DocsMenu isSheet />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              <Search type="algolia" />
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 justify-between h-auto py-2 px-2 -mx-1 rounded-md hover:bg-transparent hover:text-inherit"
                onClick={toggleExpanded}
                aria-label={isExpanded ? 'Collapse table of contents' : 'Expand table of contents'}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm capitalize">{pageTitle || 'On this page'}</span>
                </div>
                {chevronIcon}
              </Button>
            </div>

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
                  {tocs?.length ? (
                    <TocObserver
                      data={tocs}
                      activeId={activeId}
                      onActiveIdChange={setActiveId}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">No headings</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
