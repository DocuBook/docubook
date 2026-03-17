"use client"

import clsx from "clsx"
import Link from "next/link"
import { useRef, useCallback } from "react"
import { ScrollToTop } from "./ScrollToTop"
import { TocItem } from "@/lib/toc"

interface TocObserverProps {
  data: TocItem[]
  activeId?: string | null
  onActiveIdChange?: (id: string | null) => void
}

export default function TocObserver({
  data,
  activeId: externalActiveId,
  onActiveIdChange,
}: TocObserverProps) {
  const itemRefs = useRef<Map<string, HTMLAnchorElement>>(new Map())

  const activeId = externalActiveId ?? null

  const handleLinkClick = useCallback(
    (id: string) => {
      onActiveIdChange?.(id)
    },
    [onActiveIdChange]
  )

  return (
    <div className="relative">
      <div className="text-foreground/70 hover:text-foreground relative text-sm transition-colors">
        {/* Single vertical line on the left */}
        <div className="absolute left-0 top-0 h-full w-px bg-border/40 dark:bg-border/30" />

        <div className="flex flex-col gap-0">
          {data.map(({ href, level, text }) => {
            const id = href.slice(1)
            const isActive = activeId === id
            // Calculate padding based on level for indentation
            const levelPadding = (level - 2) * 16 // 0px for level 2, 16px for level 3, 32px for level 4, etc

            return (
              <div
                key={href}
                className={clsx(
                  "relative flex items-center transition-all duration-200",
                  isActive ? "bg-primary/5 dark:bg-primary/10" : ""
                )}
              >
                {/* Horizontal line connected to vertical line + Dot */}
                <div
                  className={clsx(
                    "flex items-center shrink-0 py-2 px-1 transition-all duration-200",
                    isActive ? "border-l-3 border-primary -ml-px" : ""
                  )}
                >
                  {/* Horizontal line from vertical line to dot */}
                  <div
                    className={clsx(
                      "h-px transition-colors duration-200",
                      isActive ? "w-3 bg-primary dark:bg-primary" : "w-2 bg-border/40 dark:bg-border/30"
                    )}
                  />
                  {/* Dot */}
                  <div
                    className={clsx(
                      "h-1.5 w-1.5 rounded-full transition-colors duration-300 shrink-0",
                      {
                        "bg-primary dark:bg-primary": isActive,
                        "bg-border/50 dark:bg-border/40": !isActive,
                      }
                    )}
                  />
                </div>

                {/* Text link with indentation padding */}
                <Link
                  href={href}
                  onClick={() => handleLinkClick(id)}
                  className={clsx(
                    "flex-1 flex items-center py-2 transition-all duration-200",
                    {
                      "text-primary dark:text-primary font-medium": isActive,
                      "text-muted-foreground hover:text-foreground dark:hover:text-foreground/90":
                        !isActive,
                    }
                  )}
                  style={{ paddingLeft: `${levelPadding + 6}px` }}
                  ref={(el: HTMLAnchorElement | null) => {
                    const map = itemRefs.current
                    if (el) {
                      map.set(id, el)
                    } else {
                      map.delete(id)
                    }
                  }}
                >
                  <span className="text-sm line-clamp-2 wrap-break-words">{text}</span>
                </Link>
              </div>
            )
          })}
        </div>
      </div>
      {/* Add scroll to top link at the bottom of TOC */}
      <ScrollToTop className="mt-6" />
    </div>
  )
}
