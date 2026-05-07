"use client";

import {
  Children,
  isValidElement,
  useId,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

type TabMdxProps = {
    title: string;
    children?: ReactNode;
};

export function TabMdx({ children }: TabMdxProps) {
    return <>{children}</>;
}

type TabsMdxProps = {
    className?: string;
    children: ReactNode;
};

function titleToValue(title: string) {
    return title
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-_]/g, "");
}

export function TabsMdx({ className, children }: TabsMdxProps) {
    const id = useId();
    const childArray = Children.toArray(children);

    const tabItems = childArray
        .filter(
            (child): child is ReactElement<TabMdxProps> =>
                isValidElement(child) && typeof (child.props as { title?: unknown }).title === "string"
        )
        .map((child, index) => {
            const title = child.props.title;
            const fallback = `tab-${index + 1}`;
            const slug = titleToValue(title) || fallback;
            return {
                value: `${slug}-${index + 1}`,
                title,
                children: child.props.children,
            };
        });

    const [activeValue, setActiveValue] = useState(tabItems[0]?.value ?? "");

    const activeItem = tabItems.find((item) => item.value === activeValue) ?? tabItems[0];

    return (
        <div className={className} style={{ margin: "1rem 0" }}>
            <div
                role="tablist"
                aria-orientation="horizontal"
                style={{
                    display: "flex",
                    flexWrap: "nowrap",
                    gap: "0.75rem",
                    alignItems: "center",
                    overflowX: "auto",
                    borderBottom: "1px solid hsl(var(--border, 210 20% 85%))",
                }}
            >
                {tabItems.map((item) => {
                    const active = item.value === activeItem?.value;
                    const triggerId = `${id}-tab-${item.value}`;
                    const panelId = `${id}-panel-${item.value}`;
                    return (
                        <button
                            key={item.value}
                            id={triggerId}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            aria-controls={panelId}
                            tabIndex={active ? 0 : -1}
                            onClick={() => setActiveValue(item.value)}
                            style={{
                                border: "none",
                                borderBottom: active
                                    ? "2px solid hsl(var(--primary, 210 81% 56%))"
                                    : "2px solid transparent",
                                background: "transparent",
                                color: active
                                    ? "hsl(var(--primary, 210 81% 56%))"
                                    : "hsl(var(--foreground, 220 30% 15%))",
                                fontSize: "0.875rem",
                                fontWeight: 600,
                                lineHeight: 1.2,
                                padding: "0.7rem 0.15rem",
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {item.title}
                        </button>
                    );
                })}
            </div>

            {tabItems.map((item) => {
                const active = item.value === activeItem?.value;
                const triggerId = `${id}-tab-${item.value}`;
                const panelId = `${id}-panel-${item.value}`;
                return (
                    <div
                        key={item.value}
                        role="tabpanel"
                        id={panelId}
                        aria-labelledby={triggerId}
                        hidden={!active}
                        tabIndex={0}
                        style={{
                            marginTop: "1rem",
                        }}
                    >
                        {active ? item.children : null}
                    </div>
                );
            })}
        </div>
    );
}