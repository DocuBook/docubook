"use client";

import { useId, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";

type TooltipMdxProps = HTMLAttributes<HTMLSpanElement> & {
    text?: ReactNode;
    tip?: ReactNode;
    side?: "top" | "bottom";
    style?: CSSProperties;
};

export function TooltipMdx({ text, tip, side = "top", style, className, ...props }: TooltipMdxProps) {
    const [open, setOpen] = useState(false);
    const id = useId();
    const tooltipContent = tip ?? "";
    const triggerContent = text ?? "?";
    const floatingPosition = side === "bottom" ? { top: "calc(100% + 8px)" } : { bottom: "calc(100% + 8px)" };

  return (
    <span
      className={className}
      {...props}
      style={{ position: "relative", display: "inline-block", ...style }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span
        tabIndex={0}
        aria-describedby={id}
        style={{
          cursor: "help",
          color: "hsl(var(--primary, 210 81% 56%))",
          textDecorationLine: "underline",
          textDecorationStyle: "dotted",
          textDecorationColor: "hsl(var(--primary, 210 81% 56%))",
          textUnderlineOffset: "0.18em",
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
          }
        }}
      >
        {triggerContent}
      </span>
      {open && tooltipContent ? (
        <span
          id={id}
          role="tooltip"
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            ...floatingPosition,
            border: "1px solid hsl(var(--border, 210 20% 85%))",
            background: "hsl(var(--card, 0 0% 100%))",
            color: "hsl(var(--foreground, 220 30% 15%))",
            borderRadius: 8,
            padding: "0.35rem 0.5rem",
            fontSize: "0.78rem",
            whiteSpace: "nowrap",
            zIndex: 20,
          }}
        >
          {tooltipContent}
        </span>
      ) : null}
    </span>
  );
}
