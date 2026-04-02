import { Children, cloneElement, isValidElement, type CSSProperties, type HTMLAttributes, type LiHTMLAttributes, type ReactElement, type ReactNode } from "react";

type StepperMdxProps = HTMLAttributes<HTMLOListElement> & {
    children?: ReactNode;
    style?: CSSProperties;
};

type StepperItemMdxProps = LiHTMLAttributes<HTMLLIElement> & {
    title: string;
    children?: ReactNode;
    style?: CSSProperties;
};

// Internal props including stepNumber (auto-injected)
type InternalStepperItemProps = StepperItemMdxProps & {
    stepNumber?: number;
};

export function StepperMdx({ children, style, className, ...props }: StepperMdxProps) {
    const items = Children.toArray(children);

    return (
        <ol
            className={className}
            {...props}
            style={{
                listStyle: "none",
                position: "relative",
                margin: "1.2rem 0",
                padding: 0,
                display: "grid",
                gap: 0,
                ...style,
            }}
        >
            {items.map((child, index) => {
                if (!isValidElement(child)) {
                    return child;
                }

                const item = child as ReactElement<InternalStepperItemProps>;

                return cloneElement(item, {
                    stepNumber: index + 1,
                });
            })}

            {items.length > 1 ? (
                <span
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        left: "1.05rem",
                        top: "0.8rem",
                        bottom: "0.8rem",
                        width: 1,
                        background: "hsl(var(--border, 210 14% 87%))",
                        pointerEvents: "none",
                    }}
                />
            ) : null}
        </ol>
    );
}

export function StepperItemMdx({ title, children, style, className, ...props }: InternalStepperItemProps) {
    const { stepNumber, ...liProps } = props as InternalStepperItemProps;

    return (
        <li
            className={className}
            {...liProps}
            style={{
                position: "relative",
                zIndex: 1,
                width: "100%",
                minWidth: 0,
                boxSizing: "border-box",
                marginLeft: "0.25rem",
                paddingLeft: "2.6rem",
                paddingBottom: "1.15rem",
                ...style,
            }}
        >
            <span
                aria-hidden="true"
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: stepNumber && stepNumber >= 10 ? "1.9rem" : "1.6rem",
                    height: "1.6rem",
                    borderRadius: 10,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: "hsl(var(--muted-foreground, 215 20% 50%))",
                    background: "hsl(var(--muted, 210 12% 92%))",
                    border: "1px solid hsl(var(--border, 210 14% 86%))",
                }}
            >
                {stepNumber ?? "-"}
            </span>

            <div style={{ fontWeight: 700, fontSize: "1.02rem", lineHeight: 1.35, marginBottom: children ? "0.55rem" : 0, color: "hsl(var(--foreground, 222 12% 12%))" }}>
                {title}
            </div>
            {children ? (
                <div
                    style={{
                        color: "hsl(var(--muted-foreground, 215 20% 65%))",
                        display: "flow-root",
                        width: "100%",
                        minWidth: 0,
                        maxWidth: "100%",
                        overflowX: "auto",
                        overflowY: "hidden",
                    }}
                >
                    {children}
                </div>
            ) : null}
        </li>
    );
}
