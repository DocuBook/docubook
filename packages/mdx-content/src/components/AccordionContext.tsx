"use client";

import { createContext } from "react";

type AccordionGroupContextType = {
    inGroup: boolean;
    openTitle: string | null;
    setOpenTitle: (title: string | null) => void;
};

export const AccordionGroupContext = createContext<AccordionGroupContextType | null>(null);
