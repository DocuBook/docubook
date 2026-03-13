"use client"

import React, { ReactNode } from "react"
import clsx from "clsx"
import { AccordionGroupProvider } from "@/components/markdown/AccordionContext"

interface AccordionGroupProps {
  children: ReactNode
  className?: string
}

const AccordionGroup: React.FC<AccordionGroupProps> = ({ children, className }) => {
  return (
    <AccordionGroupProvider>
      <div className={clsx("overflow-hidden rounded-lg border", className)}>{children}</div>
    </AccordionGroupProvider>
  )
}

export default AccordionGroup
