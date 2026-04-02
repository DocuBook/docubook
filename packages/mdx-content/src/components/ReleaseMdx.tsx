import type { CSSProperties, ReactNode } from "react";
import { AlertTriangle, PlusCircle, RefreshCw, Wrench, Zap, XCircle, type LucideIcon } from "lucide-react";

type ReleaseMdxProps = {
    version: string;
    date?: string;
    title: string;
    children?: ReactNode;
    style?: CSSProperties;
};

type ChangesMdxProps = {
    type?: "added" | "changed" | "fixed" | "improved" | "deprecated" | "removed";
    children?: ReactNode;
};

type ChangeType = NonNullable<ChangesMdxProps["type"]>;

const changeConfig: Record<ChangeType, { label: string; color: string; icon: LucideIcon }> = {
    added: { label: "Added", color: "#14b8a6", icon: PlusCircle },
    changed: { label: "Changed", color: "#f59e0b", icon: RefreshCw },
    fixed: { label: "Fixed", color: "#ef4444", icon: Wrench },
    improved: { label: "Improved", color: "#3b82f6", icon: Zap },
    deprecated: { label: "Deprecated", color: "#f97316", icon: AlertTriangle },
    removed: { label: "Removed", color: "#ec4899", icon: XCircle },
};

export function ReleaseMdx({ version, date, title, children, style }: ReleaseMdxProps) {
    const formattedDate = date
        ? new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
        : undefined;

    const displayVersion = version.startsWith("v") ? version : `v${version}`;

    return (
        <section
            style={{
                border: "1px solid hsl(var(--border, 210 14% 94%))",
                borderRadius: 12,
                padding: "1rem",
                margin: "1rem 0",
                background: "hsl(var(--card, 0 0% 100%))",
                ...style,
            }}
        >
            <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontWeight: 700, color: "hsl(var(--accent, 200 100% 40%))" }}>{displayVersion}</span>
                {formattedDate ? <span style={{ color: "hsl(var(--muted-foreground, 215 20% 65%))" }}>{formattedDate}</span> : null}
            </div>
            <h3 style={{ margin: 0 }}>{title}</h3>
            <div style={{ marginTop: "0.75rem" }}>{children}</div>
        </section>
    );
}

export function ChangesMdx({ type = "changed", children }: ChangesMdxProps) {
    const config = changeConfig[type] || changeConfig.changed;
    const Icon = config.icon;

    return (
        <div style={{ margin: "0.75rem 0" }}>
            <span
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    borderRadius: 999,
                    padding: "0.2rem 0.55rem",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: config.color,
                    background: `${config.color}1f`,
                }}
            >
                <Icon size={13} aria-hidden="true" />
                {config.label}
            </span>
            <div style={{ marginTop: "0.45rem" }}>{children}</div>
        </div>
    );
}
