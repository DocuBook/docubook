"use client"

import { ReactNode, useContext, useState } from "react"
import { ChevronRight } from "lucide-react"
import * as Icons from "lucide-react"
import { cn } from "@/lib/utils"
import { AccordionGroupContext } from "@/components/markdown/AccordionContext"

type AccordionProps = {
  title: string
  children?: ReactNode
  icon?: keyof typeof Icons
}

const Accordion: React.FC<AccordionProps> = ({ title, children, icon }: AccordionProps) => {
  const groupContext = useContext(AccordionGroupContext)
  const isInGroup = groupContext?.inGroup === true
  const groupOpen = groupContext?.openTitle === title
  const setGroupOpen = groupContext?.setOpenTitle
  const [localOpen, setLocalOpen] = useState(false)

  const isOpen = isInGroup ? groupOpen : localOpen

  const handleToggle = () => {
    if (isInGroup && setGroupOpen) {
      setGroupOpen(groupOpen ? null : title)
    } else {
      setLocalOpen(!localOpen)
    }
  }

  const Icon = icon ? (Icons[icon] as React.FC<{ className?: string }>) : null

  return (
    <div
      className={cn(
        !isInGroup && "rounded-lg border shadow-sm",
        isInGroup && "border-border border-b last:border-b-0"
      )}
    >
      <button
        type="button"
        onClick={handleToggle}
        className="bg-muted/40 dark:bg-muted/20 hover:bg-muted/70 dark:hover:bg-muted/70 flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-start transition-colors"
      >
        <ChevronRight
          className={cn(
            "text-muted-foreground h-4 w-4 shrink-0 transition-transform duration-200",
            isOpen && "rotate-90"
          )}
        />
        {Icon && <Icon className="text-foreground h-4 w-4 shrink-0" />}
        <h3 className="text-foreground m-0! text-base font-medium">{title}</h3>
      </button>

      {/* Always keep children mounted to avoid expensive DOM insertion on mobile.
          grid-template-rows transition collapses/expands without repaint. */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="dark:bg-muted/10 bg-muted/15 px-4 py-3">{children}</div>
        </div>
      </div>
    </div>
  )
}

export default Accordion
