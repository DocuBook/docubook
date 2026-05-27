import type { ReactNode, CSSProperties } from "react";
import { cn } from "../cn";

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

export function NavbarContainer({
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
    <div className={cn("navbar", className)}>
      {start && <div className="navbar-start">{start}</div>}
      {center && <div className="navbar-center">{center}</div>}
      {end && <div className="navbar-end">{end}</div>}
    </div>
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
            : activePath.startsWith(item.href)
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

export function NavToggle({
  isOpen,
  onClick,
  label = "Toggle navigation",
  className,
}: {
  isOpen: boolean;
  onClick: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-expanded={isOpen}
      className={cn("btn btn-ghost btn-square", className)}
    >
      <span>{isOpen ? "✕" : "☰"}</span>
    </button>
  );
}

export function NavbarVersion({ version, className }: { version: string; className?: string }) {
  return <span className={cn("badge badge-ghost text-xs", className)}>v{version}</span>;
}
