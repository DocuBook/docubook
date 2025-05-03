import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo, NavMenu } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { AlignLeftIcon } from "lucide-react";
import { FooterButtons } from "@/components/footer";
import { DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import DocsMenu from "@/components/docs-menu";
import { ModeToggle } from "@/components/theme-toggle";

export function Leftbar() {
  return (
    <aside className="lg:flex hidden flex-[1.5] min-w-[238px] sticky top-16 flex-col h-[93.75vh] overflow-y-auto">
      <ScrollArea className="py-4">
        <DocsMenu />
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
            <Logo />
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
