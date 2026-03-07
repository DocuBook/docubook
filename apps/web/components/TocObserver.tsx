"use client"

import clsx from "clsx"
import Link from "next/link"
import { useState, useRef, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
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

  // Function to check if an item has children
  const hasChildren = (currentId: string, currentLevel: number) => {
    const currentIndex = data.findIndex((item) => item.href.slice(1) === currentId)
    if (currentIndex === -1 || currentIndex === data.length - 1) return false

    const nextItem = data[currentIndex + 1]
    return nextItem.level > currentLevel
  }

  // Calculate scroll progress for the active section
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      if (!activeId) return

      const activeElement = document.getElementById(activeId)
      if (!activeElement) return

      const rect = activeElement.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const elementTop = rect.top
      const elementHeight = rect.height

      // Calculate how much of the element is visible
      let progress = 0
      if (elementTop < windowHeight) {
        progress = Math.min(1, (windowHeight - elementTop) / (windowHeight + elementHeight))
      }

      setScrollProgress(progress)
    }

    const container = document.getElementById("scroll-container") || window

    container.addEventListener("scroll", handleScroll, { passive: true })

    // Initial calculation
    handleScroll()

    return () => container.removeEventListener("scroll", handleScroll)
  }, [activeId])

  return (
    <div className="relative">
      <div className="text-foreground/70 hover:text-foreground relative text-sm transition-colors">
        <div className="flex flex-col gap-0">
          {data.map(({ href, level, text }, index) => {
            const id = href.slice(1)
            const isActive = activeId === id
            const indent = level > 1 ? (level - 1) * 20 : 0
            // Prefix with underscore to indicate intentionally unused
            const _isParent = hasChildren(id, level)
            const _isLastInLevel = index === data.length - 1 || data[index + 1].level <= level

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
                    <div
                      className={clsx(
                        "absolute left-0 top-0 h-full w-px",
                        isActive
                          ? "bg-primary/20 dark:bg-primary/30"
                          : "bg-border/50 dark:bg-border/50"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          className="bg-primary absolute left-0 top-0 h-full w-full origin-top"
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: scrollProgress }}
                          transition={{ duration: 0.3 }}
                        />
                      )}
                    </div>

                    {/* Horizontal line */}
                    <div
                      className={clsx(
                        "absolute left-0 top-1/2 h-px w-6",
                        isActive
                          ? "bg-primary/20 dark:bg-primary/30"
                          : "bg-border/50 dark:bg-border/50"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          className="bg-primary dark:bg-accent absolute left-0 top-0 h-full w-full origin-left"
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
                  className={clsx("relative flex items-center py-2 transition-colors", {
                    "text-primary dark:text-primary font-medium": isActive,
                    "text-muted-foreground hover:text-foreground dark:hover:text-foreground/90":
                      !isActive,
                  })}
                  style={{
                    paddingLeft: `${indent}px`,
                    marginLeft: level > 1 ? "12px" : "0",
                  }}
                  ref={(el) => {
                    const map = itemRefs.current
                    if (el) {
                      map.set(id, el)
                    } else {
                      map.delete(id)
                    }
                  }}
                >
                  {/* Circle indicator */}
                  <div className="relative flex h-4 w-4 shrink-0 items-center justify-center">
                    <div
                      className={clsx(
                        "relative z-10 h-1.5 w-1.5 rounded-full transition-all duration-300",
                        {
                          "bg-primary dark:bg-primary/90 scale-100": isActive,
                          "bg-muted-foreground/30 dark:bg-muted-foreground/30 group-hover:bg-primary/50 dark:group-hover:bg-primary/50 scale-75 group-hover:scale-100":
                            !isActive,
                        }
                      )}
                    >
                      {isActive && (
                        <motion.div
                          className="bg-primary/20 dark:bg-primary/30 absolute inset-0 rounded-full"
                          initial={{ scale: 1 }}
                          animate={{ scale: 1.8 }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatType: "reverse",
                          }}
                        />
                      )}
                    </div>
                  </div>

                  <span className="truncate text-sm">{text}</span>
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
