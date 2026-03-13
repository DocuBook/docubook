"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { TocItem } from "@/lib/toc"

export function useActiveSection(tocs: TocItem[]) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const clickedIdRef = useRef<string | null>(null)

  const activeIdRef = useRef<string | null>(null)

  useEffect(() => {
    activeIdRef.current = activeId
  }, [activeId])

  // Handle intersection observer for active section
  useEffect(() => {
    if (typeof document === "undefined" || !tocs.length) return

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      if (clickedIdRef.current) return

      const visibleEntries = entries.filter((entry) => entry.isIntersecting)
      if (!visibleEntries.length) return

      // Find the most visible entry
      const mostVisibleEntry = visibleEntries.reduce((prev, current) => {
        return current.intersectionRatio > prev.intersectionRatio ? current : prev
      }, visibleEntries[0])

      const newActiveId = mostVisibleEntry.target.id
      if (newActiveId !== activeIdRef.current) {
        setActiveId(newActiveId)
      }
    }

    // Determine the scroll root: #scroll-container is only used on desktop (lg)
    const isDesktop = window.innerWidth >= 1024
    const container = isDesktop ? document.getElementById("scroll-container") : null

    // Initialize intersection observer
    observerRef.current = new IntersectionObserver(handleIntersect, {
      root: container,
      rootMargin: isDesktop ? "0px 0px -60% 0px" : "-160px 0px -60% 0px",
      threshold: 0,
    })

    // Observe all headings
    tocs.forEach((toc) => {
      const element = document.getElementById(toc.href.slice(1))
      if (element) {
        observerRef.current?.observe(element)
      }
    })

    // Cleanup
    return () => {
      observerRef.current?.disconnect()
    }
  }, [tocs]) // Only depend on tocs, handle activeId via ref

  const handleLinkClick = useCallback((id: string) => {
    clickedIdRef.current = id
    setActiveId(id)

    // Reset clicked state after scroll completes
    const timer = setTimeout(() => {
      clickedIdRef.current = null
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  return {
    activeId,
    setActiveId,
    handleLinkClick,
  }
}
