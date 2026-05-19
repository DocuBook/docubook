"use client";

import { ArrowUpRight, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Search from "@/components/SearchBox";
import Anchor from "@/components/anchor";
import { Separator } from "@/components/ui/separator";
import docuConfig from "@/docu.json";
import GitHubButton from "@/components/Github";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useRef, useEffect } from "react";
import { ModeToggle } from "@/components/ThemeToggle";

interface NavbarProps {
  id?: string;
}

export function Navbar({ id }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  // Close menu when the user clicks/taps anywhere outside the navbar, or presses Escape
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  // Focus trap: keep Tab within the mobile menu when open
  useEffect(() => {
    if (!isMenuOpen || !menuRef.current) return;
    const menu = menuRef.current;
    const focusableSelector =
      'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])';

    const handleTrap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusables = menu.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    // Move focus into the menu
    const focusables = menu.querySelectorAll<HTMLElement>(focusableSelector);
    if (focusables.length > 0) focusables[0].focus();

    menu.addEventListener("keydown", handleTrap);
    return () => menu.removeEventListener("keydown", handleTrap);
  }, [isMenuOpen]);

  return (
    <div ref={navRef} className="sticky top-0 z-50 w-full">
      <nav id={id} className="bg-background h-16 w-full border-b">
        <div className="mx-auto flex h-full w-[95vw] items-center justify-between sm:container md:gap-2">
          <div className="flex items-center gap-6">
            <div className="flex">
              <Logo />
            </div>
          </div>
          <div className="flex items-center gap-0 max-md:flex-row-reverse md:gap-2">
            <div className="text-muted-foreground hidden items-center gap-4 text-sm font-medium md:flex">
              <NavMenu />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMenu}
              aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-nav-menu"
              className="flex items-center gap-1 px-2 text-sm font-medium md:hidden"
            >
              {isMenuOpen ? (
                <ChevronUp className="text-muted-foreground h-6 w-6" />
              ) : (
                <ChevronDown className="text-muted-foreground h-6 w-6" />
              )}
            </Button>

            <Separator className="my-4 hidden h-9 md:flex" orientation="vertical" />
            <Search />
            <div className="hidden md:flex">
              <GitHubButton />
            </div>
          </div>
        </div>
      </nav>

      <div
        id="mobile-nav-menu"
        ref={menuRef}
        role="dialog"
        aria-modal={isMenuOpen ? true : undefined}
        aria-label="Navigation menu"
        className="bg-background/95 grid w-full border-b shadow-sm backdrop-blur-sm transition-[grid-template-rows,opacity] duration-200 ease-in-out md:hidden"
        style={{
          gridTemplateRows: isMenuOpen ? "1fr" : "0fr",
          opacity: isMenuOpen ? 1 : 0,
          borderBottomWidth: isMenuOpen ? undefined : 0,
        }}
      >
        <div className="overflow-hidden">
          <div className="mx-auto w-[95vw] sm:container">
            <ul className="flex flex-col py-2">
              <NavMenuCollapsible onItemClick={() => setIsMenuOpen(false)} />
            </ul>
            <div className="flex items-center justify-between border-t px-1 py-3">
              <GitHubButton />
              <ModeToggle />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Logo() {
  const { navbar } = docuConfig;

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
  );
}

// Desktop NavMenu — horizontal list
export function NavMenu() {
  const { navbar } = docuConfig;

  return (
    <>
      {navbar?.menu?.map((item) => {
        const isExternal = item.href.startsWith("http");
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
        );
      })}
    </>
  );
}

// Mobile Collapsible NavMenu — vertical list items
function NavMenuCollapsible({ onItemClick }: { onItemClick: () => void }) {
  const { navbar } = docuConfig;

  return (
    <>
      {navbar?.menu?.map((item) => {
        const isExternal = item.href.startsWith("http");
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
        );
      })}
    </>
  );
}
