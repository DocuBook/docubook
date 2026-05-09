import { AnchorHTMLAttributes, ReactNode, useEffect, useState } from "react";
import { cn, isExternalUrl } from "../utils";

export interface AnchorProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href?: string;
  activeClassName?: string;
  activeWhen?: string | RegExp | ((pathname: string) => boolean);
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}

export default function Anchor({
  href = "",
  className = "",
  activeClassName = "",
  activeWhen,
  disabled = false,
  children,
  ...props
}: AnchorProps) {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!activeWhen) return;
    const pathname = window.location.pathname;
    
    let active = false;
    if (typeof activeWhen === "string") {
      active = pathname === activeWhen || pathname.endsWith(activeWhen);
    } else if (activeWhen instanceof RegExp) {
      active = activeWhen.test(pathname);
    } else if (typeof activeWhen === "function") {
      active = activeWhen(pathname);
    }
    setIsActive(active);
  }, [activeWhen]);

  const isExternal = isExternalUrl(href);

  const activeClass = isActive ? activeClassName : "";
  const baseClasses = cn(
    "text-blue-600 hover:text-blue-800 hover:underline transition-colors",
    className,
    activeClass,
    disabled && "cursor-not-allowed opacity-50"
  );

  if (disabled) {
    return (
      <span className={baseClasses}>
        {children}
      </span>
    );
  }

  if (isExternal) {
    return (
      <a
        href={href}
        className={baseClasses}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <a href={href} className={baseClasses} {...props}>
      {children}
    </a>
  );
}