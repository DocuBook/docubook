"use client";

import {
    Children,
    createContext,
    isValidElement,
    useContext,
    useId,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type HTMLAttributes,
    type KeyboardEvent,
    type ReactElement,
    type ReactNode,
} from "react";

type TabsContextValue = {
    value: string;
    setValue: (next: string) => void;
    id: string;
    orientation: "horizontal" | "vertical";
};

const TabsContext = createContext<TabsContextValue | null>(null);

type TabsProps = {
    className?: string;
    children: ReactNode;
};

type LegacyTabsProps = HTMLAttributes<HTMLDivElement> & {
    value?: string;
    defaultValue?: string;
    onValueChange?: (next: string) => void;
    style?: CSSProperties;
    orientation?: "horizontal" | "vertical";
};

type TabMdxProps = {
    title: string;
    children?: ReactNode;
};

function titleToValue(title: string) {
    return title
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-_]/g, "");
}

export function TabsMdx({
    className,
    children,
    value,
    defaultValue = "tab-1",
    onValueChange,
    style,
    orientation = "horizontal",
    ...props
}: TabsProps & LegacyTabsProps) {
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

    const hasNewApiTabs = tabItems.length > 0;
    const [newApiValue, setNewApiValue] = useState<string>(tabItems[0]?.value ?? "");

    if (hasNewApiTabs) {
        const activeValue = tabItems.some((item) => item.value === newApiValue) ? newApiValue : (tabItems[0]?.value ?? "");

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
                        borderBottom: "1px solid hsl(var(--border, 210 14% 94%))",
                    }}
                >
                    {tabItems.map((item) => {
                        const active = item.value === activeValue;
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
                                onClick={() => setNewApiValue(item.value)}
                                style={{
                                    border: "none",
                                    borderBottom: active
                                        ? "2px solid hsl(var(--primary, 221.2 83.2% 53.3%))"
                                        : "2px solid transparent",
                                    background: "transparent",
                                    color: active ? "hsl(var(--primary, 221.2 83.2% 53.3%))" : "hsl(var(--foreground, 222 12% 20%))",
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
                    const active = item.value === activeValue;
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

    const [internalValue, setInternalValue] = useState(defaultValue);
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
                style={{ margin: "1rem 0", ...style }}
            >
                {children}
            </div>
        </TabsContext.Provider>
    );
}

export function TabMdx({ children }: TabMdxProps) {
    return <>{children}</>;
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
