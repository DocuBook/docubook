"use client";

import {
  cloneElement,
  useId,
  useState,
  type ComponentType,
  type CSSProperties,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import type { LucideProps } from "lucide-react";
import { LinkMdx } from "./LinkMdx";
import { IconProp, resolveLucideIcon } from "../utils/Icon";
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

// Styling follows the home Features card
// (packages/flame/.docu/components/home/Features.tsx): rounded-2xl, p-6,
// icon in a 12×12 primary/10 rounded box, grid-pattern backdrop, hover
// border-primary/40 + shadow-lg.
const baseStyle: CSSProperties = {
  position: "relative",
  display: "block",
  border: "1px solid hsl(var(--border-color, 210 20% 85%))",
  borderRadius: 16, // rounded-2xl
  background: "hsl(var(--card, 0 0% 100%))", // bg-base-100
  color: "hsl(var(--foreground, 220 30% 15%))",
  textDecoration: "none",
  padding: "1.5rem", // p-6
  overflow: "hidden",
  transition: "border-color 0.2s ease, box-shadow 0.24s ease, transform 0.24s ease",
};

const hoverStyle: CSSProperties = {
  borderColor: "hsla(var(--primary, 210 81% 56%) / 0.4)", // hover:border-primary/40
  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)", // shadow-lg
};

const iconBoxStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 48, // h-12
  height: 48,
  borderRadius: 8, // rounded-lg
  background: "hsla(var(--primary, 210 81% 56%) / 0.1)", // bg-primary/10
  color: "hsl(var(--primary, 210 81% 56%))",
  flexShrink: 0,
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
  const patternId = `card-${useId().replace(/[:.]/g, "-")}`;
  const [hovered, setHovered] = useState(false);
  const resolvedIcon = resolveLucideIcon(icon);
  const LinkComponent = __LinkComponent ?? LinkMdx;

  const iconNode = resolvedIcon
    ? (cloneElement(resolvedIcon as ReactElement<LucideProps>, { size: 24 }) as ReactNode)
    : null;

  const content = (
    <>
      {/* Grid-pattern backdrop — fills the whole card (behind the padding).
          The card element (div or link) is position:relative, so absolute
          inset:0 here covers the full box edge to edge. */}
      <svg
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          color: "hsl(var(--primary, 210 81% 56%))",
          pointerEvents: "none",
        }}
      >
        <defs>
          <pattern id={patternId} width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              opacity="0.15"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>

      <div style={{ position: "relative", zIndex: 10 }}>
        <div
          style={
            horizontal
              ? {
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: "1rem",
                  alignItems: "flex-start",
                }
              : undefined
          }
        >
          {iconNode ? (
            <span
              aria-hidden="true"
              data-card-icon=""
              style={{
                ...iconBoxStyle,
                marginBottom: horizontal ? 0 : "1rem",
              }}
            >
              {iconNode}
            </span>
          ) : null}
          <div>
            <div
              style={{
                fontWeight: 600, // font-semibold
                fontSize: "1.125rem", // text-lg
                lineHeight: 1.4,
                marginBottom: children ? "0.5rem" : 0, // mb-2
                color: "hsl(var(--foreground, 220 30% 15%))",
              }}
            >
              {title}
            </div>
            {children ? (
              <div
                style={{
                  color: "hsl(var(--muted-foreground, 220 15% 50%))", // text-muted-foreground
                  fontSize: "0.875rem", // text-sm
                  lineHeight: 1.5,
                }}
              >
                {children}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );

  const combinedStyle = {
    ...baseStyle,
    ...(hovered ? hoverStyle : null),
    ...style,
  };

  const handlers = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
  };

  if (href) {
    return (
      <LinkComponent
        href={href}
        data-card-hover=""
        data-card-link=""
        style={combinedStyle}
        {...handlers}
        {...(className ? { className } : {})}
        {...(props as React.ComponentProps<typeof LinkComponent>)}
      >
        {content}
      </LinkComponent>
    );
  }

  return (
    <div style={combinedStyle} {...handlers} {...(className ? { className } : {})} {...props}>
      {content}
    </div>
  );
}
