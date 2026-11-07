"use client";

import { useContext, useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { AccordionGroupContext } from "../utils/AccordionGroupContext";
import { IconProp, resolveLucideIcon } from "../utils/Icon";
import { ChevronRight } from "lucide-react";

type AccordionMdxProps = {
  title: string;
  icon?: IconProp;
  className?: string;
  children?: ReactNode;
};

export function AccordionMdx({ title, icon, className, children }: AccordionMdxProps) {
  const groupContext = useContext(AccordionGroupContext);
  const [localOpen, setLocalOpen] = useState(false);
  const panelId = useId();
  const triggerId = `${panelId}-trigger`;

  const isGroup = groupContext?.inGroup === true;
  const isOpen = isGroup ? groupContext?.openTitle === title : localOpen;
  const resolvedIcon = resolveLucideIcon(icon);

  function onToggle() {
    if (isGroup && groupContext) {
      groupContext.setOpenTitle(groupContext.openTitle === title ? null : title);
      return;
    }
    setLocalOpen((prev) => !prev);
  }

  return (
    <div
      className={`mdx-accordion ${isGroup ? "mdx-accordion-group-item" : ""} ${className ?? ""}`}
      data-mdx-wrapper=""
      style={{
        minWidth: 0,
        border: isGroup ? undefined : "1px solid hsl(var(--border-color, 210 20% 85%))",
        borderRadius: isGroup ? 0 : 16,
        overflow: "hidden",
        background: "hsl(var(--card, 0 0% 100%))",
      }}
    >
      <button
        className="mdx-accordion-header"
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        id={triggerId}
        onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onToggle();
          }
        }}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: "0.75rem",
          textAlign: "left",
          border: 0,
          cursor: "pointer",
          background: "transparent",
          color: "hsl(var(--foreground, 220 30% 15%))",
          fontFamily: "inherit",
          fontSize: "inherit",
          fontWeight: 500,
          lineHeight: 1.5,
          padding: "0.875rem 1.25rem",
        }}
      >
        <ChevronRight
          className="mdx-accordion-chevron"
          aria-hidden="true"
          size={16}
          strokeWidth={1.5}
          style={{
            transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            flexShrink: 0,
            color: "hsl(var(--foreground, 220 30% 15%) / 0.74)",
          }}
        />
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.75rem",
            flex: 1,
            minWidth: 0,
          }}
        >
          {resolvedIcon ? (
            <span
              className="mdx-accordion-icon"
              aria-hidden="true"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "1rem",
                height: "1rem",
                flexShrink: 0,
                color: "hsl(var(--foreground, 220 30% 15%))",
              }}
            >
              {resolvedIcon}
            </span>
          ) : null}
          <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>{title}</span>
        </span>
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={triggerId}
        hidden={!isOpen}
        className="mdx-accordion-content"
        style={{
          minWidth: 0,
          overflowX: "auto",
          padding: "0 1.25rem 0.875rem",
          background: "hsl(var(--card, 0 0% 100%))",
          color: "hsl(var(--card-foreground, 220 30% 15%))",
        }}
      >
        {children}
      </div>
    </div>
  );
}
