"use client";

import { useState } from "react";
import type { ComponentType, CSSProperties, HTMLAttributes, ReactNode } from "react";
import { LinkMdx } from "./LinkMdx";
import { IconProp, resolveLucideIcon } from "./IconMdx";
import type { LinkMdxProps } from "./LinkMdx";

type LinkRenderer = ComponentType<LinkMdxProps>;

export type CardMdxProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  icon?: IconProp;
  href?: string;
  horizontal?: boolean;
  children?: ReactNode;
  style?: CSSProperties;
  /** Internal adapter hook: inject framework link component without duplicating styles. */
  __LinkComponent?: LinkRenderer;
};

const baseStyle: CSSProperties = {
  display: "block",
  border: "1px solid hsl(var(--border, 210 20% 85%))",
  borderRadius: 14,
  background: "hsl(var(--card, 0 0% 100%))",
  color: "hsl(var(--foreground, 220 30% 15%))",
  textDecoration: "none",
  padding: "1rem",
  minHeight: 120,
  boxShadow: "0 0 0 rgba(0,0,0,0)",
  transition:
    "border-color 0.2s ease, box-shadow 0.24s ease, transform 0.24s ease, color 0.2s ease",
  overflow: "hidden",
};

export function CardMdx({
  title,
  icon,
  href,
  horizontal,
  children,
  style,
  className,
  __LinkComponent,
  ...props
}: CardMdxProps) {
  const [hover, setHover] = useState(false);
  const resolvedIcon = resolveLucideIcon(icon);
  const LinkComponent = __LinkComponent ?? LinkMdx;

  const content = (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: horizontal ? "auto 1fr" : "1fr",
        gap: horizontal ? "0.75rem" : "0.4rem",
        alignItems: horizontal ? "flex-start" : "flex-start",
      }}
    >
      {resolvedIcon ? (
        <span
          aria-hidden="true"
          style={{
            display: "block",
            alignItems: "center",
            justifyContent: "center",
            width: "1rem",
            height: "1rem",
            color: "hsl(var(--primary, 210 81% 56%))",
            fontSize: "2rem",
            transition: "transform 0.2s ease, color 0.2s ease",
            transform: hover ? "scale(1.05)" : "scale(1)",
          }}
        >
          {resolvedIcon}
        </span>
      ) : null}
      <div style={{ display: "grid", gridAutoRows: "min-content", gap: 0 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: "1.22rem",
            lineHeight: 1.3,
            color: "hsl(var(--foreground, 220 30% 15%))",
          }}
        >
          {title}
        </div>
        {children ? (
          <div
            style={{
              color: "hsl(var(--muted-foreground, 220 15% 50%))",
              fontSize: "0.96rem",
              lineHeight: 1.42,
              marginTop: "-0.5rem",
            }}
          >
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );

  const interactiveStyle: CSSProperties = href
    ? {
        cursor: "pointer",
        borderColor: hover ? "hsl(var(--primary, 210 81% 56%))" : "hsl(var(--border, 210 20% 85%))",
        boxShadow: hover ? "0 11px 28px rgba(34, 129, 227, 0.15)" : "0 0 0 rgba(0, 0, 0, 0)",
        transform: hover ? "translateY(-2px)" : "translateY(0)",
      }
    : {
        borderColor: "hsl(var(--border, 210 20% 85%))",
        boxShadow: "0 0 0 rgba(0, 0, 0, 0)",
      };

  const combinedStyle = { ...baseStyle, ...interactiveStyle, ...style };

  const divProps = {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: combinedStyle,
    ...(className ? { className } : {}),
    ...props,
  };

  if (href) {
    return (
      <LinkComponent
        href={href}
        data-card-link=""
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={combinedStyle}
        {...(className ? { className } : {})}
        {...(props as React.ComponentProps<typeof LinkComponent>)}
      >
        {content}
      </LinkComponent>
    );
  }

  return <div {...divProps}>{content}</div>;
}
