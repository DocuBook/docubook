import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Search from "@/components/search";
import Anchor from "@/components/anchor";
import { SheetLeftbar } from "@/components/leftbar";
import { SheetClose } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import docuConfig from "@/docu.json"; // Import JSON

export function Navbar() {

  return (
    <nav className="sticky top-0 z-50 w-full h-16 border-b bg-background">
      <div className="sm:container mx-auto w-[95vw] h-full flex items-center justify-between md:gap-2">
        <div className="flex items-center gap-5">
          <SheetLeftbar />
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex">
              <Logo />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <div className="items-center hidden gap-4 text-sm font-medium lg:flex text-muted-foreground">
              <NavMenu />
            </div>
            <Separator className="hidden lg:flex my-4 h-9" orientation="vertical" />
            <Search />
        </div>
      </div>
    </nav>
  );
}

export function Logo() {
  const { navbar } = docuConfig; // Extract navbar from JSON

  return (
    <Link href="/" className="flex items-center gap-1.5">
      <Image src={navbar.logo.src} alt={navbar.logo.alt} width="24" height="24" />
      <h2 className="font-bold font-code text-md">{navbar.logoText}</h2>
    </Link>
  );
}

export function NavMenu({ isSheet = false }) {
  const { navbar } = docuConfig; // Extract navbar from JSON

  return (
    <>
      {navbar?.menu?.map((item) => {
        const isExternal = item.href.startsWith("http");

        const Comp = (
          <Anchor
            key={`${item.title}-${item.href}`}
            activeClassName="!text-primary md:font-semibold font-medium"
            absolute
            className="flex items-center gap-1 dark:text-stone-300/85 text-stone-800"
            href={item.href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
          >
            {item.title}
            {isExternal && <ArrowUpRight className="w-4 h-4 text-muted-foreground" />}
          </Anchor>
        );
        return isSheet ? (
          <SheetClose key={item.title + item.href} asChild>
            {Comp}
          </SheetClose>
        ) : (
          Comp
        );
      })}
    </>
  );
}
