import { AnchorHTMLAttributes, ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn, isExternalUrl } from "../lib/utils";

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
  const isActive = (() => {
    if (!activeWhen || typeof window === "undefined") return false;
    const pathname = window.location.pathname;
    if (typeof activeWhen === "string")
      return pathname === activeWhen || pathname.endsWith(activeWhen);
    if (activeWhen instanceof RegExp) return activeWhen.test(pathname);
    if (typeof activeWhen === "function") return activeWhen(pathname);
    return false;
  })();

  const isExternal = isExternalUrl(href);

  const activeClass = isActive ? activeClassName : "";
  const baseClasses = cn(
    "text-blue-600 hover:text-blue-800 hover:underline transition-colors",
    className,
    activeClass,
    disabled && "cursor-not-allowed opacity-50"
  );

  if (disabled) {
    return <span className={baseClasses}>{children}</span>;
  }

  if (isExternal) {
    return (
      <a href={href} className={baseClasses} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
        <ArrowUpRight className="ml-0.5 inline-block h-3.5 w-3.5" />
      </a>
    );
  }

  return (
    <a href={href} className={baseClasses} {...props}>
      {children}
    </a>
  );
}
