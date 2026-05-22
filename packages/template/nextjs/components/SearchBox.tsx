"use client"

import { Dialog } from "@/components/ui/dialog"
import { SearchTrigger } from "@/components/SearchTrigger"
import { SearchModal } from "@/components/SearchModal"
import AlgoliaSearch from "@/components/DocSearch"
import { useSearch } from "./SearchContext"
import { DialogTrigger } from "@/components/ui/dialog"
import { searchConfig } from "@/lib/search/config"

interface SearchProps {
  /**
   * Override the search type from config.
   * If not provided, uses the config value.
   */
  type?: "default" | "algolia"
  className?: string
}

export default function Search({ type, className }: SearchProps) {
  const { isOpen, setIsOpen } = useSearch()
  const searchType = type ?? searchConfig.type

  if (searchType === "algolia") {
    return <AlgoliaSearch className={className} />
  }

  // Logic for 'default' search
  return (
    <div className={className}>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <SearchTrigger className={className} />
        </DialogTrigger>
        <SearchModal isOpen={isOpen} setIsOpen={setIsOpen} />
      </Dialog>
    </div>
  )
}
