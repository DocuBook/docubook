import type { ButtonHTMLAttributes, ComponentType, CSSProperties } from "react";
import { LinkMdx } from "./LinkMdx";
import { IconProp, resolveLucideIcon } from "./IconMdx";
import type { LinkMdxProps } from "./LinkMdx";

type LinkRenderer = ComponentType<LinkMdxProps>;

export type ButtonMdxProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: string;
    variant?: "primary" | "secondary" | "ghost";
    variation?: "primary" | "secondary" | "ghost";
    size?: "sm" | "md" | "lg";
    icon?: IconProp;
    text?: string;
    target?: string;
    /** Internal adapter hook: inject framework link component without duplicating styles. */
    __LinkComponent?: LinkRenderer;
};

const baseStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.375rem",
    borderRadius: 10,
    border: "1px solid hsl(var(--border, 210 14% 94%))",
    background: "hsl(var(--card, 0 0% 100%))",
    color: "hsl(var(--foreground, 222 12% 12%))",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: "0.9rem",
    lineHeight: 1,
    padding: "0.65rem 0.85rem",
    cursor: "pointer",
};

const variantStyles: Record<NonNullable<ButtonMdxProps["variant"]>, CSSProperties> = {
    primary: {
        background: "hsl(var(--accent, 200 100% 40%))",
        borderColor: "hsl(var(--accent, 200 100% 40%))",
        color: "#ffffff",
    },
    secondary: {
        background: "hsl(var(--muted, 210 12% 96%))",
        color: "hsl(var(--foreground, 222 12% 12%))",
    },
    ghost: {
        background: "transparent",
        borderColor: "transparent",
        color: "hsl(var(--foreground, 222 12% 12%))",
    },
};

const sizeStyles: Record<NonNullable<ButtonMdxProps["size"]>, CSSProperties> = {
    sm: { padding: "0.45rem 0.6rem", fontSize: "0.8rem" },
    md: { padding: "0.65rem 0.85rem", fontSize: "0.9rem" },
    lg: { padding: "0.8rem 1rem", fontSize: "0.96rem" },
};

export function ButtonMdx({ href, variant, variation, size = "md", icon, text, style, children, target, __LinkComponent, ...props }: ButtonMdxProps) {
    const resolvedVariant = variation ?? variant ?? "secondary";
    const mergedStyle = { ...baseStyle, ...variantStyles[resolvedVariant], ...sizeStyles[size], ...style };
    const resolvedIcon = resolveLucideIcon(icon);
    const LinkComponent = __LinkComponent ?? LinkMdx;
    const content = (
        <>
            {resolvedIcon ? <span aria-hidden="true" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{resolvedIcon}</span> : null}
            {text ?? children}
        </>
    );

    if (href) {
        return (
            <LinkComponent href={href} target={target} style={mergedStyle}>
                {content}
            </LinkComponent>
        );
    }

    return (
        <button type={props.type ?? "button"} {...props} style={mergedStyle}>
            {content}
        </button>
    );
}
