"use client"

import React, { ReactNode } from "react";
import clsx from "clsx";
import { AccordionGroupContext } from "@/components/contexts/AccordionContext";

interface AccordionGroupProps {
  children: ReactNode;
  className?: string;
}

const AccordionGroup: React.FC<AccordionGroupProps> = ({ children, className }) => {

  return (
    // Wrap all children with the AccordionGroupContext.Provider
    // so that any nested accordions know they are inside a group.
    // This enables group-specific behavior in child components.
    <AccordionGroupContext.Provider value={{ inGroup: true }}>
      <div
        className={clsx(
          "border rounded-lg overflow-hidden",
          className
        )}
      >
        {children}
      </div>
    </AccordionGroupContext.Provider>
  );
};

export default AccordionGroup;