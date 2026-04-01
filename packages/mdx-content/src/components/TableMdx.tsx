import type { CSSProperties, HTMLAttributes, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";

const tableShellStyle: CSSProperties = {
    position: "relative",
    width: "100%",
    overflowX: "auto",
    overflowY: "hidden",
    border: "1px solid hsl(var(--border, 210 14% 94%))",
    borderRadius: 10,
    margin: "1rem 0",
};

const cellBaseStyle: CSSProperties = {
    padding: "0.6rem 0.75rem",
    verticalAlign: "middle",
    borderBottom: "1px solid hsl(var(--border, 210 14% 94%))",
};

export function TableMdx({ style, ...props }: TableHTMLAttributes<HTMLTableElement>) {
    return (
        <div style={{ ...tableShellStyle }}>
            <table
                {...props}
                style={{
                    width: "100%",
                    fontSize: "0.925rem",
                    borderCollapse: "collapse",
                    margin: 0,
                    ...style,
                }}
            />
        </div>
    );
}

export function TableHeaderMdx(props: HTMLAttributes<HTMLTableSectionElement>) {
    return (
        <thead
            {...props}
            style={{
                background: "hsl(var(--muted, 210 12% 96%))",
                ...props.style,
            }}
        />
    );
}

export function TableBodyMdx(props: HTMLAttributes<HTMLTableSectionElement>) {
    return <tbody {...props} />;
}

export function TableFooterMdx(props: HTMLAttributes<HTMLTableSectionElement>) {
    return (
        <tfoot
            {...props}
            style={{
                background: "hsl(var(--muted, 210 12% 96%))",
                borderTop: "1px solid hsl(var(--border, 210 14% 94%))",
                ...props.style,
            }}
        />
    );
}

export function TableRowMdx(props: HTMLAttributes<HTMLTableRowElement>) {
    return <tr {...props} />;
}

export function TableHeadMdx(props: ThHTMLAttributes<HTMLTableCellElement>) {
    return (
        <th
            scope={props.scope ?? "col"}
            {...props}
            style={{
                ...cellBaseStyle,
                textAlign: "left",
                color: "hsl(var(--muted-foreground, 215 20% 65%))",
                fontWeight: 600,
                ...props.style,
            }}
        />
    );
}

export function TableCellMdx(props: TdHTMLAttributes<HTMLTableCellElement>) {
    return <td {...props} style={{ ...cellBaseStyle, ...props.style }} />;
}
