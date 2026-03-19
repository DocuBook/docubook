"use client"

import { ChevronDown, ChevronUp, PanelRight, MoreVertical } from "lucide-react"
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTrigger } from "@/components/ui/sheet"
import DocsMenu from "@/components/DocsMenu"
import { ModeToggle } from "@/components/ThemeToggle"
import { DialogTitle, DialogDescription } from "@/components/ui/dialog"
import ContextPopover from "@/components/ContextPopover"
import TocObserver from "./TocObserver"
import * as React from "react"
import { useRef, useMemo } from "react"
import { usePathname } from "next/navigation"
import { Button } from "./ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { useActiveSection } from "@/hooks"
import { TocItem } from "@/lib/toc"
import Search from "@/components/SearchBox"
import GitHubButton from "@/components/Github"
import { NavMenu } from "@/components/navbar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface MobTocProps {
  tocs: TocItem[]
  title?: string
}

const useClickOutside = (ref: React.RefObject<HTMLElement | null>, callback: () => void) => {
  const handleClick = React.useCallback(
    (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback()
      }
    },
    [ref, callback]
  )

  React.useEffect(() => {
    document.addEventListener("mousedown", handleClick)
    return () => {
      document.removeEventListener("mousedown", handleClick)
    }
  }, [handleClick])
}

export default function MobToc({ tocs, title }: MobTocProps) {
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = React.useState(false)
  const tocRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Use custom hooks
  const { activeId, setActiveId } = useActiveSection(tocs)

  // Only show on /docs pages
  const isDocsPage = useMemo(() => pathname?.startsWith("/docs"), [pathname])

  // Get title from active section if available, otherwise document title
  const activeSection = useMemo(() => {
    return tocs.find((toc) => toc.href.slice(1) === activeId)
  }, [tocs, activeId])

  const displayTitle = activeSection?.text || title || "On this page"

  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Toggle expanded state
  const toggleExpanded = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded((prev) => !prev)
  }, [])

  // Close TOC when clicking outside
  useClickOutside(tocRef, () => {
    if (isExpanded) {
      setIsExpanded(false)
    }
  })

  // Don't render anything if not on docs page
  if (!isDocsPage || !mounted) return null

  const chevronIcon = isExpanded ? (
    <ChevronUp className="text-muted-foreground h-4 w-4 shrink-0" />
  ) : (
    <ChevronDown className="text-muted-foreground h-4 w-4 shrink-0" />
  )

  return (
    <AnimatePresence>
      <motion.div
        ref={tocRef}
        className="sticky top-0 z-50 -mx-4 -mt-4 mb-4 lg:hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15, ease: "easeInOut" }}
      >
        <div className="bg-background/95 border-muted dark:border-foreground/10 dark:bg-background w-full border-b shadow-sm backdrop-blur-sm">
          <div className="p-2">
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    aria-label="Navigation menu"
                  >
                    <MoreVertical className="text-muted-foreground h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="flex min-w-40 flex-col gap-1 p-2"
                >
                  <NavMenu />
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="sm"
                className="-mx-1 h-auto flex-1 justify-between rounded-md px-2 py-2 hover:bg-transparent hover:text-inherit min-w-0"
                onClick={toggleExpanded}
                aria-label={isExpanded ? "Collapse table of contents" : "Expand table of contents"}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium capitalize line-clamp-1 truncate">{displayTitle}</span>
                </div>
                {chevronIcon}
              </Button>
              <Search />
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="hidden max-lg:flex">
                    <PanelRight className="text-muted-foreground h-6 w-6 shrink-0" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="flex w-full flex-col gap-4 px-0 lg:w-auto" side="right">
                  <DialogTitle className="sr-only">Navigation Menu</DialogTitle>
                  <DialogDescription className="sr-only">
                    Main navigation menu with links to different sections
                  </DialogDescription>
                  <SheetHeader>
                    <SheetClose className="px-4" asChild>
                      <div className="flex items-center justify-between">
                        <GitHubButton />
                        <div className="mr-8">
                          <ModeToggle />
                        </div>
                      </div>
                    </SheetClose>
                  </SheetHeader>
                  <div className="flex flex-col gap-4 overflow-y-auto">
                    <div className="mx-2 space-y-2 px-5">
                      <ContextPopover />
                      <DocsMenu isSheet />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  ref={contentRef}
                  className="-mx-1 mt-2 max-h-[60vh] overflow-y-auto px-1 pb-2"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  {tocs?.length ? (
                    <TocObserver data={tocs} activeId={activeId} onActiveIdChange={setActiveId} />
                  ) : (
                    <p className="text-muted-foreground py-2 text-sm">No headings</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
