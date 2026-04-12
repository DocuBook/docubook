"use client";

import { useEffect, useState, useRef, type ReactNode } from "react";
import { Ellipsis } from "lucide-react";

type ExpandableCodeProps = {
  isExpandable: boolean
  totalLines: number
  preContent: ReactNode
  preProps: Record<string, unknown>
  className?: string
}

const DEFAULT_VISIBLE_LINES = 20
const FALLBACK_LINE_HEIGHT_PX = 24

export function ExpandableCode({
  isExpandable,
  totalLines,
  preContent,
  preProps,
  className,
}: ExpandableCodeProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [collapsedMaxHeight, setCollapsedMaxHeight] = useState(
    `${DEFAULT_VISIBLE_LINES * FALLBACK_LINE_HEIGHT_PX}px`
  )
  const preRef = useRef<HTMLPreElement>(null)

  const shouldShow = isExpandable && totalLines > DEFAULT_VISIBLE_LINES
  const isCollapsed = shouldShow && !isOpen

  useEffect(() => {
    const pre = preRef.current
    if (!pre) return

    const calculateCollapsedHeight = () => {
      const styles = window.getComputedStyle(pre)
      const paddingTop = Number.parseFloat(styles.paddingTop) || 0
      const paddingBottom = Number.parseFloat(styles.paddingBottom) || 0
      const contentHeight = Math.max(pre.scrollHeight - paddingTop - paddingBottom, 0)

      if (totalLines > 0 && contentHeight > 0) {
        const lineHeight = contentHeight / totalLines
        setCollapsedMaxHeight(
          `${DEFAULT_VISIBLE_LINES * lineHeight + paddingTop + paddingBottom}px`
        )
        return
      }

      let lineHeight = Number.parseFloat(styles.lineHeight)
      if (!Number.isFinite(lineHeight) || lineHeight === 0) {
        const fontSize = Number.parseFloat(styles.fontSize)
        lineHeight = Number.isFinite(fontSize) ? fontSize * 1.5 : FALLBACK_LINE_HEIGHT_PX
      }

      setCollapsedMaxHeight(`${DEFAULT_VISIBLE_LINES * lineHeight + paddingTop + paddingBottom}px`)
    }

    const frame = requestAnimationFrame(calculateCollapsedHeight)
    const timeout = window.setTimeout(calculateCollapsedHeight, 50)
    window.addEventListener("resize", calculateCollapsedHeight)

    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(timeout)
      window.removeEventListener("resize", calculateCollapsedHeight)
    }
  }, [preContent, totalLines])

  return (
    <>
      <div
        style={{
          overflowX: "auto",
          overscrollBehaviorX: "contain",
        }}
      >
        <pre
          ref={preRef}
          {...preProps}
          className={`${className || ""} mdx-expandable-code`}
          style={{
            margin: 0,
            padding: "0.9rem",
            overflowX: "visible",
            width: "max-content !important" as any,
            minWidth: "100%",
            maxHeight: isCollapsed ? collapsedMaxHeight : "none",
            overflowY: isCollapsed ? "hidden" : "visible",
            transition: "max-height 0.3s ease",
            scrollbarWidth: "thin",
            backgroundColor: "transparent !important" as any,
          }}
        >
          {preContent}
        </pre>
      </div>

      {shouldShow && (
        <div
          className="code-block-expandable-footer"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0.6rem",
            background: "hsl(var(--muted, 210 20% 92%))",
            borderTop: "1px solid hsl(var(--border, 210 20% 85%))",
          }}
        >
          <button
            className="code-block-expandable-toggle"
            onClick={() => setIsOpen(!isOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.4rem 0.8rem",
              border: "1px solid hsl(var(--border, 210 20% 85%))",
              borderRadius: 6,
              background: "hsl(var(--background, 210 40% 98%))",
              color: "hsl(var(--foreground, 220 30% 15%))",
              fontSize: "0.85rem",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s ease",
              fontFamily: "inherit",
            }}
          >
            <Ellipsis
              size={16}
              style={{
                transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
            />
            <span>{isOpen ? "Collapse" : `See all ${totalLines} lines`}</span>
          </button>
        </div>
      )}
    </>
  )
}
