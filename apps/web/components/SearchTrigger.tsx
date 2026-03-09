"use client"

import { CommandIcon, SearchIcon } from "lucide-react"
import { DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface SearchTriggerProps {
  className?: string
}

export function SearchTrigger({ className }: SearchTriggerProps) {
  return (
    <DialogTrigger asChild>
      <div className={cn("relative flex-1 cursor-pointer", className)}>
        <div className="flex items-center">
          <div className="-ml-2 block p-2 lg:hidden">
            <SearchIcon className="text-muted-foreground h-6 w-6" />
          </div>
          <div className="hidden w-full lg:block">
            <SearchIcon className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              className="dark:bg-background/95 bg-background h-9 w-full overflow-ellipsis rounded-full border pl-10 pr-0 text-sm shadow-sm sm:pr-4"
              placeholder="Search"
              readOnly // This input is for display only
            />
            <div className="dark:bg-accent bg-accent absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-0.5 rounded-full px-2 py-0.5 font-mono text-xs font-medium text-white">
              <CommandIcon className="h-3 w-3" />
              <span>K</span>
            </div>
          </div>
        </div>
      </div>
    </DialogTrigger>
  )
}
