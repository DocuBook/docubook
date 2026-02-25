"use client"
import { useState } from "react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo, NavMenu } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { LayoutGrid, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import DocsMenu from "@/components/docs-menu";
import { ModeToggle } from "@/components/theme-toggle";
import ContextPopover from "@/components/context-popover";

// Toggle Button Component
export function ToggleButton({
  collapsed,
  onToggle
}: {
  collapsed: boolean,
  onToggle: () => void
}) {
  return (
    <div className="absolute top-0 right-0 py-6 z-10 -mt-4">
      <Button
        size="icon"
        variant="outline"
        className="cursor-pointer hover:bg-transparent hover:text-inherit border-none text-muted-foreground"
        onClick={onToggle}
      >
        {collapsed ? (
          <PanelLeftOpen size={18} />
        ) : (
          <PanelLeftClose size={18} />
        )}
      </Button>
    </div>
  )
}

export function Leftbar() {
  const [collapsed, setCollapsed] = useState(false);
  const toggleCollapse = () => setCollapsed(prev => !prev);

  return (
    <aside
      className={`sticky lg:flex hidden top-16 h-[calc(100vh-4rem)] border-r bg-background transition-all duration-300
      ${collapsed ? "w-[24px]" : "w-[280px]"} flex flex-col pr-2`}
    >
      <ToggleButton collapsed={collapsed} onToggle={toggleCollapse} />
      {/* Scrollable Content */}
      <ScrollArea className="flex-1 px-0.5 pb-4">
        {!collapsed && (
          <div className="space-y-2">
            <ContextPopover />
            <DocsMenu />
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}

export function SheetLeftbar() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="max-lg:flex hidden">
          <LayoutGrid />
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col gap-4 px-0" side="left">
        <DialogTitle className="sr-only">Navigation Menu</DialogTitle>
        <DialogDescription className="sr-only">
          Main navigation menu with links to different sections
        </DialogDescription>
        <SheetHeader>
          <SheetClose className="px-5" asChild>
            <span className="px-2"><Logo /></span>
          </SheetClose>
        </SheetHeader>
        <div className="flex flex-col gap-4 overflow-y-auto">
          <div className="flex flex-col gap-2.5 mt-3 mx-2 px-5">
            <NavMenu isSheet />
          </div>
          <div className="mx-2 px-5 space-y-2">
            <ContextPopover />
            <DocsMenu isSheet />
          </div>
          <div className="flex w-2/4 px-5">
            <ModeToggle />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
