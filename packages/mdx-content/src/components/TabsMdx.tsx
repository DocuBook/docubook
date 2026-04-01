"use client";

import { createContext, useContext, useId, useMemo, useRef, useState, type CSSProperties, type HTMLAttributes, type KeyboardEvent, type ReactNode } from "react";

type TabsContextValue = {
    value: string;
    setValue: (next: string) => void;
    id: string;
    orientation: "horizontal" | "vertical";
};

const TabsContext = createContext<TabsContextValue | null>(null);

type TabsProps = HTMLAttributes<HTMLDivElement> & {
    value?: string;
    defaultValue?: string;
    onValueChange?: (next: string) => void;
    children: ReactNode;
    style?: CSSProperties;
    orientation?: "horizontal" | "vertical";
};

export function TabsMdx({ value, defaultValue = "tab-1", onValueChange, children, style, orientation = "horizontal", className, ...props }: TabsProps) {
    const [internalValue, setInternalValue] = useState(defaultValue);
    const id = useId();
    const selected = value ?? internalValue;

    const setValue = (next: string) => {
        if (value === undefined) {
            setInternalValue(next);
        }
        onValueChange?.(next);
    };

    const contextValue = useMemo(() => ({ value: selected, setValue, id, orientation }), [selected, id, orientation]);

    return (
        <TabsContext.Provider value={contextValue}>
            <div
                className={className}
                {...props}
                style={{ border: "1px solid hsl(var(--border, 210 14% 94%))", borderRadius: 10, margin: "1rem 0", ...style }}
            >
                {children}
            </div>
        </TabsContext.Provider>
    );
}

export function TabsListMdx({ children, style, ...props }: HTMLAttributes<HTMLDivElement>) {
    const context = useContext(TabsContext);

    return (
        <div
            role="tablist"
            aria-orientation={context?.orientation ?? "horizontal"}
            {...props}
            style={{
                display: "flex",
                flexDirection: context?.orientation === "vertical" ? "column" : "row",
                alignItems: context?.orientation === "vertical" ? "stretch" : "center",
                gap: 8,
                overflowX: "auto",
                borderBottom: "1px solid hsl(var(--border, 210 14% 94%))",
                padding: "0.25rem 0.5rem",
                ...style,
            }}
        >
            {children}
        </div>
    );
}

type TabsTriggerProps = HTMLAttributes<HTMLButtonElement> & {
    value: string;
};

export function TabsTriggerMdx({ value, children, style, onKeyDown, ...props }: TabsTriggerProps) {
    const context = useContext(TabsContext);
    const triggerRef = useRef<HTMLButtonElement | null>(null);

    if (!context) {
        return null;
    }

    const tabsContext = context;

    const active = context.value === value;
    const controlId = `${context.id}-panel-${value}`;
    const triggerId = `${context.id}-tab-${value}`;

    function moveFocus(direction: 1 | -1) {
        const tablist = triggerRef.current?.closest('[role="tablist"]');
        if (!tablist) return;

        const triggers = Array.from(tablist.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
        const currentIndex = triggers.findIndex((item) => item === triggerRef.current);
        if (currentIndex < 0) return;

        const nextIndex = (currentIndex + direction + triggers.length) % triggers.length;
        const nextTrigger = triggers[nextIndex];
        const nextValue = nextTrigger.dataset.value;

        nextTrigger.focus();
        if (nextValue) {
            tabsContext.setValue(nextValue);
        }
    }

    return (
        <button
            ref={triggerRef}
            type="button"
            role="tab"
            id={triggerId}
            aria-controls={controlId}
            aria-selected={active}
            data-value={value}
            tabIndex={active ? 0 : -1}
            onClick={() => tabsContext.setValue(value)}
            onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    tabsContext.setValue(value);
                }

                if ((tabsContext.orientation === "horizontal" && e.key === "ArrowRight") || (tabsContext.orientation === "vertical" && e.key === "ArrowDown")) {
                    e.preventDefault();
                    moveFocus(1);
                }

                if ((tabsContext.orientation === "horizontal" && e.key === "ArrowLeft") || (tabsContext.orientation === "vertical" && e.key === "ArrowUp")) {
                    e.preventDefault();
                    moveFocus(-1);
                }

                if (e.key === "Home") {
                    e.preventDefault();
                    const tablist = triggerRef.current?.closest('[role="tablist"]');
                    const firstTrigger = tablist?.querySelector<HTMLButtonElement>('[role="tab"]');
                    firstTrigger?.focus();
                    if (firstTrigger?.dataset.value) {
                        tabsContext.setValue(firstTrigger.dataset.value);
                    }
                }

                if (e.key === "End") {
                    e.preventDefault();
                    const tablist = triggerRef.current?.closest('[role="tablist"]');
                    const triggers = tablist ? Array.from(tablist.querySelectorAll<HTMLButtonElement>('[role="tab"]')) : [];
                    const lastTrigger = triggers.at(-1);
                    lastTrigger?.focus();
                    if (lastTrigger?.dataset.value) {
                        tabsContext.setValue(lastTrigger.dataset.value);
                    }
                }

                onKeyDown?.(e);
            }}
            {...props}
            style={{
                border: "none",
                borderBottom: active ? "2px solid hsl(var(--accent, 200 100% 40%))" : "2px solid transparent",
                background: "transparent",
                color: active ? "hsl(var(--foreground, 222 12% 12%))" : "hsl(var(--muted-foreground, 215 20% 65%))",
                fontSize: "0.875rem",
                fontWeight: 600,
                padding: "0.6rem 0.5rem",
                cursor: "pointer",
                ...style,
            }}
        >
            {children}
        </button>
    );
}

type TabsContentProps = HTMLAttributes<HTMLDivElement> & {
    value: string;
};

export function TabsContentMdx({ value, children, style, ...props }: TabsContentProps) {
    const context = useContext(TabsContext);
    if (!context) {
        return null;
    }

    const active = context.value === value;
    const panelId = `${context.id}-panel-${value}`;
    const triggerId = `${context.id}-tab-${value}`;

    return (
        <div
            role="tabpanel"
            id={panelId}
            aria-labelledby={triggerId}
            tabIndex={0}
            hidden={!active}
            {...props}
            style={{
                padding: "0.75rem",
                ...style,
            }}
        >
            {active ? children : null}
        </div>
    );
}
