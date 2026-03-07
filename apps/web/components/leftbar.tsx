"use client"
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTrigger } from "@/components/ui/sheet"
import { Logo, NavMenu } from "@/components/Navbar"
import { Button } from "@/components/ui/button"
import { PanelRight } from "lucide-react"
import { DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import DocsMenu from "@/components/DocsMenu"
import { ModeToggle } from "@/components/ThemeToggle"
import ContextPopover from "@/components/ContextPopover"
import Search from "@/components/SearchBox"
import GitHubStarButton from "@/components/GithubStart"

export function Leftbar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-[280px] shrink-0 flex-col lg:flex">
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center px-5">
        <Logo />
      </div>

      <div className="flex shrink-0 items-center gap-2 px-4 pb-4">
        <Search type="algolia" />
      </div>

      {/* Scrollable Navigation */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-2">
          <ContextPopover />
          <DocsMenu />
        </div>
      </ScrollArea>

      {/* Bottom: Theme Toggle */}
      <div className="flex px-4 py-3">
        <ModeToggle />
      </div>
    </aside>
  )
}

export function SheetLeftbar() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="hidden max-md:flex">
          <PanelRight className="h-6 w-6 shrink-0 text-muted-foreground" />
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col gap-4 px-0" side="right">
        <DialogTitle className="sr-only">Navigation Menu</DialogTitle>
        <DialogDescription className="sr-only">
          Main navigation menu with links to different sections
        </DialogDescription>
        <SheetHeader>
          <SheetClose className="px-4" asChild>
            <div className="flex items-center justify-between">
              <GitHubStarButton />
              <div className="mr-8">
                <ModeToggle />
              </div>
            </div>
          </SheetClose>
        </SheetHeader>
        <div className="flex flex-col gap-4 overflow-y-auto">
          <div className="mx-2 mt-3 flex flex-col gap-2.5 px-5">
            <NavMenu />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
