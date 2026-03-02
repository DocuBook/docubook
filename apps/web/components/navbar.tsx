import { ArrowUpRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import Search from "@/components/SearchBox"
import Anchor from "@/components/anchor"
import { SheetLeftbar } from "@/components/leftbar"
import { SheetClose } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import docuConfig from "@/docu.json" // Import JSON
import GitHubStarButton from "@/components/GithubStart"

interface NavbarProps {
  id?: string
}

export function Navbar({ id }: NavbarProps) {
  return (
    <nav id={id} className="bg-background sticky top-0 z-50 h-16 w-full border-b">
      <div className="mx-auto flex h-full w-[95vw] items-center justify-between sm:container md:gap-2">
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex">
            <Logo />
          </div>
        </div>
        <div className="flex items-center gap-2 max-md:flex-row-reverse">
          <SheetLeftbar />
          <div className="text-muted-foreground hidden items-center gap-4 text-sm font-medium md:flex">
            <NavMenu />
          </div>
          <Separator className="my-4 hidden h-9 md:flex" orientation="vertical" />
          <Search type="algolia" />
          <div className="hidden md:flex">
            <GitHubStarButton />
          </div>
        </div>
      </div>
    </nav>
  )
}

export function Logo() {
  const { navbar } = docuConfig // Extract navbar from JSON

  return (
    <Link href="/" className="flex items-center gap-1.5">
      <div className="relative h-8 w-8">
        <Image
          src={navbar.logo.src}
          alt={navbar.logo.alt}
          fill
          sizes="32px"
          className="object-contain"
        />
      </div>
      <h2 className="font-code dark:text-accent text-primary text-lg font-bold">
        {navbar.logoText}
      </h2>
    </Link>
  )
}

export function NavMenu({ isSheet = false }) {
  const { navbar } = docuConfig // Extract navbar from JSON

  return (
    <>
      {navbar?.menu?.map((item) => {
        const isExternal = item.href.startsWith("http")

        const Comp = (
          <Anchor
            key={`${item.title}-${item.href}`}
            activeClassName="text-primary dark:text-accent md:font-semibold font-medium"
            absolute
            className="text-foreground/80 hover:text-foreground flex items-center gap-1 transition-colors"
            href={item.href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
          >
            {item.title}
            {isExternal && <ArrowUpRight className="text-foreground/80 h-4 w-4" />}
          </Anchor>
        )
        return isSheet ? (
          <SheetClose key={item.title + item.href} asChild>
            {Comp}
          </SheetClose>
        ) : (
          Comp
        )
      })}
    </>
  )
}
