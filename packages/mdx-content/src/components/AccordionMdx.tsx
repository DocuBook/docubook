"use client";

import { useContext, useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { AccordionGroupContext } from "./AccordionContext";
import { IconProp, resolveLucideIcon } from "./IconMdx";
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
            style={{
                border: "1px solid hsl(var(--border, 210 14% 94%))",
                borderRadius: 10,
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
                    gap: "0.5rem",
                    textAlign: "left",
                    border: 0,
                    cursor: "pointer",
                    background: "hsl(var(--muted, 210 12% 96%))",
                    color: "hsl(var(--foreground, 222 12% 12%))",
                    fontWeight: 600,
                    padding: "0.95rem 1rem",
                }}
            >
                <ChevronRight
                    className="mdx-accordion-chevron"
                    aria-hidden="true"
                    size={16}
                    style={{
                        transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                        flexShrink: 0,
                        color: "hsl(var(--foreground, 222 12% 12%) / 0.74)",
                        marginRight: "0.4rem",
                    }}
                />
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", flex: 1 }}>
                    {resolvedIcon ? (
                        <span
                            aria-hidden="true"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                minWidth: "1.45rem",
                                height: "1.45rem",
                                color: "hsl(var(--foreground, 222 12% 12%))",
                            }}
                        >
                            {resolvedIcon}
                        </span>
                    ) : null}
                    <span>{title}</span>
                </span>
            </button>
            <div
                id={panelId}
                role="region"
                aria-labelledby={triggerId}
                hidden={!isOpen}
                className="mdx-accordion-content"
                style={{
                    padding: "0.75rem 0.8rem",
                    background: "hsl(var(--card, 0 0% 100%))",
                    color: "hsl(var(--card-foreground, 222 12% 20%))",
                }}
            >
                {children}
            </div>
        </div>
    );
}
