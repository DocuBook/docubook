import type { ReactNode, CSSProperties } from "react";

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
}

export interface NavMenuItem {
  title: string;
  href: string;
  isExternal?: boolean;
}

export interface NavMenuProps {
  items: NavMenuItem[];
  onItemClick?: () => void;
  activePath?: string;
}

export function Navbar({ id, children, className, style }: NavbarProps) {
  return (
    <nav id={id} className={className} style={style}>
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
    <div className={className}>
      {start && <div className="flex-start">{start}</div>}
      {center && <div className="flex-center">{center}</div>}
      {end && <div className="flex-none">{end}</div>}
    </div>
  );
}

export function Logo({ src, alt, text, href = "/" }: LogoProps) {
  return (
    <a href={href} className="logo-link">
      {src ? (
        <img src={src} alt={alt || text || "Logo"} className="logo-image" />
      ) : (
        <span className="logo-text">{text}</span>
      )}
    </a>
  );
}

export function NavMenu({ items, activePath }: NavMenuProps) {
  return (
    <ul className="nav-menu">
      {items.map((item) => {
        const isActive = activePath && item.href.includes(activePath);
        return (
          <li key={item.title + item.href}>
            <a
              href={item.href}
              className={`nav-menu-item ${isActive ? "active" : ""}`}
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

export function NavMenuLink({ item, isActive }: { item: NavMenuItem; isActive?: boolean }) {
  return (
    <a
      href={item.href}
      className={`nav-menu-item ${isActive ? "active" : ""}`}
      target={item.isExternal ? "_blank" : undefined}
      rel={item.isExternal ? "noopener noreferrer" : undefined}
    >
      {item.title}
    </a>
  );
}

export function NavToggle({
  isOpen,
  onClick,
  label = "Toggle navigation",
}: {
  isOpen: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-expanded={isOpen}
      className="nav-toggle"
    >
      <span className={`toggle-icon ${isOpen ? "open" : ""}`}>
        {isOpen ? "✕" : "☰"}
      </span>
    </button>
  );
}

export function NavbarVersion({ version }: { version: string }) {
  return (
    <span className="navbar-version">
      v{version}
    </span>
  );
}