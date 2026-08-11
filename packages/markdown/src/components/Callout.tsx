"use client";

import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { type IconName, resolveLucideIcon } from "../utils/Icon";

export type CalloutType = "tip" | "info" | "danger" | "warning" | "success";

type CalloutProps = HTMLAttributes<HTMLElement> & {
  /** Internal — set by the registry variant (Tip/Info/Danger/Warning/Success). */
  type: CalloutType;
  /** Optional; falls back to the callout label (Tip, Info, …). */
  title?: string;
  children?: ReactNode;
  style?: CSSProperties;
};

const palette: Record<
  CalloutType,
  {
    border: string;
    bg: string;
    text: string;
    header: string;
    content: string;
    defaultIcon: IconName;
  }
> = {
  danger: {
    border: "hsl(var(--destructive, 0 85% 60%))",
    bg: "hsl(var(--destructive, 0 85% 60%) / 0.16)",
    text: "hsl(var(--foreground, 220 30% 15%))",
    header: "hsl(var(--destructive, 0 85% 60%))",
    content: "hsl(var(--destructive, 0 85% 60%) / 0.75)",
    defaultIcon: "Siren",
  },
  warning: {
    border: "hsl(36 100% 56%)",
    bg: "rgba(249, 115, 22, 0.14)",
    text: "hsl(var(--foreground, 220 30% 15%))",
    header: "hsl(36 100% 56%)",
    content: "rgba(249, 115, 22, 0.9)",
    defaultIcon: "TriangleAlert",
  },
  success: {
    border: "hsl(137 50% 35%)",
    bg: "hsl(137 50% 35% / 0.16)",
    text: "hsl(var(--foreground, 220 30% 15%))",
    header: "hsl(137 50% 35%)",
    content: "hsl(137 50% 35% / 0.75)",
    defaultIcon: "CircleCheck",
  },
  info: {
    border: "hsl(var(--primary, 210 81% 56%))",
    bg: "hsl(var(--primary, 210 81% 56%) / 0.16)",
    text: "hsl(var(--foreground, 220 30% 15%))",
    header: "hsl(var(--primary, 210 81% 56%))",
    content: "hsl(var(--primary, 210 81% 56%) / 0.75)",
    defaultIcon: "Info",
  },
  tip: {
    border: "hsl(137 50% 35%)",
    bg: "hsl(137 50% 35% / 0.16)",
    text: "hsl(var(--foreground, 220 30% 15%))",
    header: "hsl(137 50% 35%)",
    content: "hsl(137 50% 35% / 0.75)",
    defaultIcon: "Lightbulb",
  },
};

const LABEL: Record<CalloutType, string> = {
  tip: "Tip",
  info: "Info",
  danger: "Danger",
  warning: "Warning",
  success: "Success",
};

export function Callout({ type, title, children, style, className, ...props }: CalloutProps) {
  const token = palette[type];
  if (!token) return null;
  const resolvedIcon = resolveLucideIcon(token.defaultIcon);
  const normalizedTitle = typeof title === "string" ? title.trim() : title;
  const fallbackTitle = normalizedTitle || LABEL[type];

  return (
    <aside
      role="note"
      className={className}
      {...props}
      style={{
        border: "1px solid transparent",
        borderLeft: `4px solid ${token.border}`,
        borderRadius: 10,
        background: token.bg,
        color: token.text,
        padding: "0.5rem 1rem",
        margin: "1rem 0",
        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.08)",
        ...style,
      }}
    >
      {fallbackTitle || resolvedIcon ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontWeight: 700,
            marginBottom: "0.35rem",
            color: token.header,
          }}
        >
          {resolvedIcon ? (
            <span
              aria-hidden="true"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 20,
                height: 20,
                color: token.header,
              }}
            >
              {resolvedIcon}
            </span>
          ) : null}
          <span style={{ color: token.header }}>{fallbackTitle}</span>
        </div>
      ) : null}
      <div style={{ color: token.content, lineHeight: 1.5 }}>{children}</div>
    </aside>
  );
}
