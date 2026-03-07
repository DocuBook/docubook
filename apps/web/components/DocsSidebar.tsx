"use client"

import { ChevronDown, ChevronUp, PanelRight } from "lucide-react"
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
import GitHubStarButton from "@/components/GithubStart"

interface MobTocProps {
  tocs: TocItem[]
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

export default function MobToc({ tocs }: MobTocProps) {
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = React.useState(false)
  const tocRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Use custom hooks
  const { activeId, setActiveId } = useActiveSection(tocs)

  // Only show on /docs pages
  const isDocsPage = useMemo(() => pathname?.startsWith("/docs"), [pathname])

  // Get title from path segment (last part of URL)
  const pageTitle = pathname?.split("/").filter(Boolean).pop() || ""

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

  // Handle body overflow when TOC is expanded
  React.useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [isExpanded])

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
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        <div className="bg-background/95 w-full border-b border-muted shadow-sm backdrop-blur-sm dark:border-foreground/10 dark:bg-background">
          <div className="p-2">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="-mx-1 h-auto flex-1 justify-between rounded-md px-2 py-2 hover:bg-transparent hover:text-inherit"
                onClick={toggleExpanded}
                aria-label={isExpanded ? "Collapse table of contents" : "Expand table of contents"}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium capitalize">
                    {pageTitle || "On this page"}
                  </span>
                </div>
                {chevronIcon}
              </Button>
              <Search type="algolia" />
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="hidden max-lg:flex">
                    <PanelRight className="h-6 w-6 shrink-0" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="flex flex-col gap-4 px-0" side="right">
                  <DialogTitle className="sr-only">Navigation Menu</DialogTitle>
                  <DialogDescription className="sr-only">
                    Main navigation menu with links to different sections
                  </DialogDescription>
                  <SheetHeader>
                    <SheetClose className="px-4" asChild>
                      <div className="flex items-center justify-between">
                        <GitHubStarButton />
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
