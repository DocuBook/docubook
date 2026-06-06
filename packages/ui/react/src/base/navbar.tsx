import type { ReactNode, CSSProperties } from "react";
import { cn } from "../utils/cn";

export interface NavbarProps {
  id?: string;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}
export interface LogoProps {
  src?: string;
  alt?: string;
  text?: string;
  href?: string;
  className?: string;
}
export interface NavMenuItem {
  title: string;
  href: string;
  isExternal?: boolean;
}
export interface NavMenuProps {
  items: NavMenuItem[];
  activePath?: string;
  className?: string;
}

export function Navbar({ id, children, className, style }: NavbarProps) {
  return (
    <nav id={id} className={cn("navbar", className)} style={style}>
      {children}
    </nav>
  );
}

export function Logo({ src, alt, text, href = "/", className }: LogoProps) {
  return (
    <a href={href} className={cn("flex items-center gap-2", className)}>
      {src ? <img src={src} alt={alt || text || "Logo"} className="h-8 w-8" /> : null}
      {text && <span className="text-xl font-bold">{text}</span>}
    </a>
  );
}

export function NavMenu({ items, activePath, className }: NavMenuProps) {
  return (
    <ul className={cn("menu menu-horizontal gap-1", className)}>
      {items.map((item) => {
        const isActive = activePath
          ? item.href === "/"
            ? activePath === "/"
            : activePath === item.href || activePath.startsWith(item.href + "/")
          : false;
        return (
          <li key={item.href}>
            <a
              href={item.href}
              className={cn(isActive && "active")}
              target={item.isExternal ? "_blank" : undefined}
              rel={item.isExternal ? "noopener noreferrer" : undefined}
            >
              {item.title}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

export function NavMenuLink({
  item,
  isActive,
  className,
}: {
  item: NavMenuItem;
  isActive?: boolean;
  className?: string;
}) {
  return (
    <a
      href={item.href}
      className={cn(isActive && "active", className)}
      target={item.isExternal ? "_blank" : undefined}
      rel={item.isExternal ? "noopener noreferrer" : undefined}
    >
      {item.title}
    </a>
  );
}
