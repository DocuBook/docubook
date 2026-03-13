"use client";

import { ArrowUpRight } from "lucide-react";
import GitHubButton from "@/components/Github";
import Anchor from "@/components/anchor";
import docuConfig from "@/docu.json";

interface NavbarItem {
  title: string;
  href: string;
}

const { navbar } = docuConfig;

export function DocsNavbar() {
  // Show all nav items
  const navItems = navbar?.menu || [];

  return (
    <div className="hidden lg:flex items-center justify-end gap-6 h-14 px-8 mt-2">
      {/* Navigation Links */}
      <div className="flex items-center gap-6 text-sm font-medium text-foreground/80">
        {navItems.map((item: NavbarItem) => {
          const isExternal = item.href.startsWith("http");
          return (
            <Anchor
              key={`${item.title}-${item.href}`}
              href={item.href}
              absolute
              activeClassName="text-primary dark:text-accent md:font-semibold font-medium"
              className="flex items-center gap-1 hover:text-foreground transition-colors"
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
            >
              {item.title}
              {isExternal && <ArrowUpRight className="w-3.5 h-3.5" />}
            </Anchor>
          );
        })}
        <GitHubButton />
      </div>
    </div>
  );
}

export default DocsNavbar;
