import { createContext, useState, useId } from "react"

type AccordionGroupContextType = {
  inGroup: boolean
  groupId: string
  openTitle: string | null
  setOpenTitle: (title: string | null) => void
}

export const AccordionGroupContext = createContext<AccordionGroupContextType | null>(null)

export function AccordionGroupProvider({ children }: { children: React.ReactNode }) {
  const [openTitle, setOpenTitle] = useState<string | null>(null)
  const groupId = useId()

  return (
    <AccordionGroupContext.Provider value={{ inGroup: true, groupId, openTitle, setOpenTitle }}>
      {children}
    </AccordionGroupContext.Provider>
  )
}
