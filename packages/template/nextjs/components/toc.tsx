"use client"

import TocObserver from "./TocObserver"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ListIcon } from "lucide-react"
import Sponsor from "./Sponsor"
import { useActiveSection } from "@/hooks"
import { TocItem } from "@/lib/toc"
import { cn } from "@/lib/utils"

export default function Toc({ tocs }: { tocs: TocItem[] }) {
  const { activeId, setActiveId } = useActiveSection(tocs)
  const hasTocs = Boolean(tocs?.length)

  const wrapperClassName = cn(
    hasTocs ? "toc" : "",
    "flex-3 sticky top-4 hidden h-[calc(100vh-8rem)] min-w-[240px] self-start lg:flex lg:p-8"
  )

  return (
    <div className={wrapperClassName}>
      <div className="flex h-full w-full flex-col gap-2 px-2">
        {hasTocs && (
          <>
            <div className="flex items-center gap-2">
              <ListIcon className="h-4 w-4" />
              <h3 className="text-sm font-medium">On this page</h3>
            </div>
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full">
                <TocObserver data={tocs} activeId={activeId} onActiveIdChange={setActiveId} />
                <div className="mt-4">
                  <Sponsor />
                </div>
              </ScrollArea>
            </div>
          </>
        )}
        {!hasTocs && (
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="mt-4">
                <Sponsor />
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  )
}
