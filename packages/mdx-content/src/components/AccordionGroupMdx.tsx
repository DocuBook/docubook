"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AccordionGroupContext } from "./AccordionContext";

type AccordionsMdxProps = {
    children?: ReactNode;
};

export function AccordionsMdx({ children }: AccordionsMdxProps) {
    const [openTitle, setOpenTitle] = useState<string | null>(null);

    const value = useMemo(
        () => ({ inGroup: true, openTitle, setOpenTitle }),
        [openTitle]
    );

    return (
        <AccordionGroupContext.Provider value={value}>
            <div
                className="mdx-accordion-group"
                style={{
                    margin: "1rem 0",
                    display: "grid",
                    gap: "0.85rem",
                }}
            >
                {children}
            </div>
        </AccordionGroupContext.Provider>
    );
}