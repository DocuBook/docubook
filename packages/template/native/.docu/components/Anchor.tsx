import { AnchorHTMLAttributes, ReactNode } from "react";
import { cn, isExternalUrl } from "./utils";

export interface AnchorProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href?: string;
  activeClassName?: string;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}

export default function Anchor({
  href = "",
  className = "",
  activeClassName = "",
  disabled = false,
  children,
  ...props
}: AnchorProps) {
  const isExternal = isExternalUrl(href);

  const baseClasses = cn(
    "text-blue-600 hover:text-blue-800 hover:underline transition-colors",
    className,
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