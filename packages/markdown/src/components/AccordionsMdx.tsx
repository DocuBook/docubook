"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AccordionGroupContext } from "../utils/AccordionGroupContext";

type AccordionsMdxProps = {
  children?: ReactNode;
};

export function AccordionsMdx({ children }: AccordionsMdxProps) {
  const [openTitle, setOpenTitle] = useState<string | null>(null);

  const value = useMemo(() => ({ inGroup: true, openTitle, setOpenTitle }), [openTitle]);

  return (
    <AccordionGroupContext.Provider value={value}>
      <div
        className="mdx-accordion-group"
        style={{
          margin: "1rem 0",
          display: "grid",
          minWidth: 0,
          border: "1px solid hsl(var(--border-color, 210 20% 85%))",
          borderRadius: 16,
          overflow: "hidden",
          background: "hsl(var(--card, 0 0% 100%))",
        }}
      >
        {children}
      </div>
    </AccordionGroupContext.Provider>
  );
}
