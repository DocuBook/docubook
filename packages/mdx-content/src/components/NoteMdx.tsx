import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { IconProp, IconName, resolveLucideIcon } from "./IconMdx";

type NoteType = "note" | "danger" | "warning" | "success" | "info" | "tip";

type NoteMdxProps = HTMLAttributes<HTMLElement> & {
    type?: NoteType;
    title?: string;
    icon?: IconProp;
    children?: ReactNode;
    style?: CSSProperties;
};

const palette: Record<NoteType, { border: string; bg: string; text: string; header: string; content: string; defaultIcon: IconName }> = {
    note: {
        border: "hsl(var(--primary, 210 81% 56%))",
        bg: "hsl(var(--primary, 210 81% 56%) / 0.16)",
        text: "hsl(var(--foreground, 220 30% 15%))",
        header: "hsl(var(--primary, 210 81% 56%))",
        content: "hsl(var(--primary, 210 81% 56%) / 0.75)",
        defaultIcon: "Info",
    },
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
        text: "hsl(24 100% 18%)",
        header: "hsl(36 100% 56%)",
        content: "hsl(36 100% 56% / 0.75)",
        defaultIcon: "AlertTriangle",
    },
    success: {
        border: "hsl(145 63% 42%)",
        bg: "hsl(145 63% 42% / 0.16)",
        text: "hsl(var(--foreground, 220 30% 15%))",
        header: "hsl(145 63% 42%)",
        content: "hsl(145 63% 42% / 0.75)",
        defaultIcon: "CheckCircle2",
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

export function NoteMdx({ type = "note", title, icon, children, style, className, ...props }: NoteMdxProps) {
    const token = palette[type];

    const normalizedIcon = typeof icon === "string" ? icon.trim() : icon;
    const normalizedTitle = typeof title === "string" ? title.trim() : title;
    const resolvedIcon = resolveLucideIcon(normalizedIcon || token.defaultIcon);
    const fallbackTitle = normalizedTitle || type.charAt(0).toUpperCase() + type.slice(1);

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
            {(fallbackTitle || resolvedIcon) ? (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, marginBottom: "0.35rem", color: token.header }}>
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
            <div style={{ color: token.content, lineHeight: 1.5 }}>
                {children}
            </div>
        </aside>
    );
}
