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
import { AlignLeftIcon, ArrowLeftFromLine, ArrowRightFromLine } from "lucide-react";
import { FooterButtons } from "@/components/footer";
import { DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import DocsMenu from "@/components/docs-menu";
import { ModeToggle } from "@/components/theme-toggle";

export function Leftbar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`sticky lg:flex hidden top-16 h-[calc(100vh-4rem)] border-r bg-background transition-all duration-300
      ${collapsed ? "w-[0px]" : "w-[250px]"} flex flex-col pr-2`}
    >
      {/* Toggle Button */}
      <div className="absolute top-0 right-0 py-2 px-0 ml-6 z-10">
        <Button
          size="icon"
          variant="outline"
          className="hover:bg-transparent hover:text-inherit border-none text-muted-foreground"
          onClick={() => setCollapsed((prev) => !prev)}
        >
          {collapsed ? (
            <ArrowRightFromLine size={18} />
          ) : (
            <ArrowLeftFromLine size={18} />
          )}
        </Button>
      </div>

      {/* Scrollable DocsMenu */}
      <ScrollArea className="flex-1 px-2 pb-4">
        {!collapsed && <DocsMenu />}
      </ScrollArea>
    </aside>
  );
}

export function SheetLeftbar() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="max-lg:flex hidden">
          <AlignLeftIcon />
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col gap-4 px-0" side="left">
        <DialogTitle className="sr-only">Menu</DialogTitle>
        <SheetHeader>
          <SheetClose className="px-5" asChild>
            <span className="px-2"><Logo /></span>
          </SheetClose>
        </SheetHeader>
        <div className="flex flex-col gap-4 overflow-y-auto">
          <div className="flex flex-col gap-2.5 mt-3 mx-2 px-5">
            <NavMenu isSheet />
          </div>
          <div className="mx-2 px-5">
            <DocsMenu isSheet />
          </div>
          <div className="px-6 py-2 flex justify-start items-center gap-6">
            <FooterButtons />
          </div>
          <div className="flex w-2/4 px-5">
            <ModeToggle />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
