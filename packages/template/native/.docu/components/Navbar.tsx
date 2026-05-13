import type { ReactNode } from "react";
import { useState } from "react";
import Anchor from "./Anchor";
import { cn } from "../lib/utils";
import {
  Navbar as BaseNavbar,
  Logo as BaseLogo,
  NavMenu as BaseNavMenu,
  NavMenuLink as BaseNavMenuLink,
  type NavMenuItem as BaseNavMenuItem,
} from "./base/navbar";

export type { NavMenuItem } from "./base/navbar";

interface AppNavMenuItem {
  title: string;
  href: string;
}

interface NavbarProps {
  logo?: { src?: string; alt?: string };
  logoText?: string;
  menu: AppNavMenuItem[];
  id?: string;
  className?: string;
}

function AppLogo({ logo, logoText }: { logo?: { src?: string; alt?: string }; logoText?: string }) {
  return <BaseLogo src={logo?.src} alt={logo?.alt} text={logoText} href="/docs" />;
}

function AppNavMenu({ menu, currentPath }: { menu: AppNavMenuItem[]; currentPath?: string }) {
  return <BaseNavMenu items={menu} activePath={currentPath} />;
}

export function Navbar({ logo, logoText, menu, id = "navbar", className }: NavbarProps) {
  const [currentPath] = useState(() =>
    typeof window !== "undefined" ? window.location.pathname : "/"
  );

  return (
    <BaseNavbar id={id} className={cn("bg-base-200 px-4", className)}>
      <div className="flex-1">
        <AppLogo logo={logo} logoText={logoText} />
      </div>
      <div className="flex-none">
        <AppNavMenu menu={menu} currentPath={currentPath} />
        <MobileMenuToggle menu={menu} currentPath={currentPath} />
      </div>
    </BaseNavbar>
  );
}

export function NavbarLayout({
  start,
  center,
  end,
  className,
}: {
  start?: ReactNode;
  center?: ReactNode;
  end?: ReactNode;
  className?: string;
}) {
  return (
    <BaseNavbar className={cn("bg-base-200 px-4", className)}>
      {start && <div className="flex-1">{start}</div>}
      {center && <div className="flex-1">{center}</div>}
      {end && <div className="flex-none">{end}</div>}
    </BaseNavbar>
  );
}

export { BaseNavbar as Logo };

export function NavMenu({ items, activePath }: { items: BaseNavMenuItem[]; activePath?: string }) {
  return <BaseNavMenu items={items} activePath={activePath} />;
}

export function NavMenuLink({ item, isActive }: { item: BaseNavMenuItem; isActive?: boolean }) {
  return <BaseNavMenuLink item={item} isActive={isActive} />;
}

export function NavItem({ item }: { item: BaseNavMenuItem }) {
  return (
    <Anchor
      href={item.href}
      activeClassName="text-primary font-semibold"
      className="text-sm font-medium"
    >
      {item.title}
    </Anchor>
  );
}

export function MobileMenuToggle({
  menu,
  currentPath,
}: {
  menu: AppNavMenuItem[];
  currentPath?: string;
}) {
  return (
    <div className="md:hidden">
      <details className="dropdown dropdown-end">
        <summary
          tabIndex={0}
          role="button"
          className="btn btn-ghost btn-sm"
          aria-label="Navigation menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </summary>
        <ul
          tabIndex={0}
          className="dropdown-content menu bg-base-200 rounded-box z-[1] mt-2 w-52 p-2 shadow"
        >
          {menu.map((item) => (
            <li key={item.title + item.href}>
              <Anchor
                href={item.href}
                activeWhen={
                  currentPath
                    ? (path: string) =>
                        path === item.href ||
                        path.startsWith(item.href + "/") ||
                        path.endsWith(item.href + ".html")
                    : undefined
                }
                activeClassName="text-primary font-semibold"
              >
                {item.title}
              </Anchor>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

export function NavbarBrand({
  logo,
  logoText,
}: {
  logo?: { src?: string; alt?: string };
  logoText?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {logo?.src ? (
        <img
          src={logo.src}
          alt={logo.alt ?? logoText ?? ""}
          width={32}
          height={32}
          className="h-8 w-8"
        />
      ) : (
        <div className="bg-primary h-8 w-8 rounded-lg" />
      )}
      <span className="text-xl font-bold">{logoText ?? "Logo"}</span>
    </div>
  );
}

export function GitHubLink({ repoUrl }: { repoUrl?: string }) {
  if (!repoUrl) return null;

  return (
    <a
      href={repoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="btn btn-ghost btn-sm btn-circle text-muted-foreground"
      aria-label="GitHub"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    </a>
  );
}

export default Navbar;
