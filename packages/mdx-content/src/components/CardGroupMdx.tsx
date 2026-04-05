import type { CSSProperties, ReactNode } from "react";

type CardsMdxProps = {
    cols?: number;
    children?: ReactNode;
    style?: CSSProperties;
};

export function CardsMdx({ cols = 2, children, style }: CardsMdxProps) {
    const columnCount = Math.max(1, Math.min(4, cols));

    return (
        <>
            <div
                className="docubook-card-group"
                style={
                    {
                        "--docubook-card-group-template": `repeat(${columnCount}, minmax(240px, 1fr))`,
                        ...style,
                    } as CSSProperties
                }
            >
                {children}
            </div>
            <style>{`
                .docubook-card-group {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 1rem;
                    margin: 1.2rem 0;
                    align-items: stretch;
                    width: 100%;
                    grid-auto-rows: minmax(0, auto);
                }

                @media (min-width: 768px) {
                    .docubook-card-group {
                        grid-template-columns: var(--docubook-card-group-template, repeat(2, minmax(220px, 1fr)));
                    }
                }
            `}</style>
        </>
    );
}

/** @deprecated Use `CardsMdx` instead. */
export function CardGroupMdx(props: CardsMdxProps) {
    return <CardsMdx {...props} />;
}
