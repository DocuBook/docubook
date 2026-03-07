"use client"

import { ArrowUpRight, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import Search from "@/components/SearchBox"
import Anchor from "@/components/Anchor"
import { Separator } from "@/components/ui/separator"
import docuConfig from "@/docu.json"
import GitHubStarButton from "@/components/GithubStart"
import { Button } from "@/components/ui/button"
import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ModeToggle } from "@/components/ThemeToggle"

interface NavbarProps {
  id?: string
}

export function Navbar({ id }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev)
  }, [])

  return (
    <div className="sticky top-0 z-50 w-full">
      <nav id={id} className="bg-background h-16 w-full border-b">
        <div className="mx-auto flex h-full w-[95vw] items-center justify-between sm:container md:gap-2">
          <div className="flex items-center gap-6">
            <div className="flex">
              <Logo />
            </div>
          </div>
          <div className="flex items-center md:gap-2 gap-0 max-md:flex-row-reverse">
            <div className="text-muted-foreground hidden items-center gap-4 text-sm font-medium md:flex">
              <NavMenu />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMenu}
              aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMenuOpen}
              className="flex items-center gap-1 px-2 text-sm font-medium md:hidden"
            >
              {isMenuOpen ? (
                <ChevronUp className="h-6 w-6 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-6 w-6 text-muted-foreground" />
              )}
            </Button>

            <Separator className="my-4 hidden h-9 md:flex" orientation="vertical" />
            <Search type="algolia" />
            <div className="hidden md:flex">
              <GitHubStarButton />
            </div>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="bg-background/95 w-full border-b shadow-sm backdrop-blur-sm md:hidden"
          >
            <div className="mx-auto w-[95vw] sm:container">
              <ul className="flex flex-col py-2">
                <NavMenuCollapsible onItemClick={() => setIsMenuOpen(false)} />
              </ul>
              <div className="flex items-center justify-between border-t px-1 py-3">
                <GitHubStarButton />
                <ModeToggle />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Logo() {
  const { navbar } = docuConfig

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

// Desktop NavMenu — horizontal list
export function NavMenu() {
  const { navbar } = docuConfig

  return (
    <>
      {navbar?.menu?.map((item) => {
        const isExternal = item.href.startsWith("http")
        return (
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
      })}
    </>
  )
}

// Mobile Collapsible NavMenu — vertical list items
function NavMenuCollapsible({ onItemClick }: { onItemClick: () => void }) {
  const { navbar } = docuConfig

  return (
    <>
      {navbar?.menu?.map((item) => {
        const isExternal = item.href.startsWith("http")
        return (
          <li key={item.title + item.href}>
            <Anchor
              activeClassName="text-primary dark:text-accent font-semibold"
              absolute
              className="text-foreground/80 hover:text-foreground hover:bg-muted flex w-full items-center justify-between gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors"
              href={item.href}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
              onClick={onItemClick}
            >
              {item.title}
              {isExternal && <ArrowUpRight className="text-foreground/60 h-4 w-4 shrink-0" />}
            </Anchor>
          </li>
        )
      })}
    </>
  )
}
