"use client"

import { Dialog } from "@/components/ui/dialog"
import { SearchTrigger } from "@/components/SearchTrigger"
import { SearchModal } from "@/components/SearchModal"
import DocSearchComponent from "@/components/DocSearch"
import { useSearch } from "./SearchContext"
import { DialogTrigger } from "@/components/ui/dialog"

interface SearchProps {
  /**
   * Specify which search engine to use.
   * @default 'default'
   */
  type?: "default" | "algolia"
}

export default function Search({ type = "default" }: SearchProps) {
  const { isOpen, setIsOpen } = useSearch()

  if (type === "algolia") {
    // Just render the component without passing any state props
    return <DocSearchComponent />
  }

  // Logic for 'default' search
  return (
    <div>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <SearchTrigger />
        </DialogTrigger>
        <SearchModal isOpen={isOpen} setIsOpen={setIsOpen} />
      </Dialog>
    </div>
  )
}
