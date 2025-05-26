"use client";

import { cn } from "@/lib/utils";
import Link, { LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { forwardRef } from "react";

type AnchorProps = LinkProps & {
  absolute?: boolean;
  activeClassName?: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps>;

const Anchor = forwardRef<HTMLAnchorElement, AnchorProps>(
  ({
    absolute = false,
    className = "",
    activeClassName = "",
    disabled = false,
    children,
    href,
    ...props
  }, ref) => {
    const path = usePathname();
    const hrefStr = href?.toString() || '';

    // Check if URL is external
    const isExternal = /^(https?:\/\/|\/\/)/.test(hrefStr);

    // Check if current path matches the link
    const isActive = absolute
      ? hrefStr.split("/")[1] === path?.split("/")[1]
      : path === hrefStr;

    // Apply active class only for internal links
    const linkClassName = cn(
      'transition-colors hover:text-primary',
      className,
      !isExternal && isActive && activeClassName
    );

    if (disabled) {
      return (
        <span className={cn(linkClassName, "cursor-not-allowed opacity-50")}>
          {children}
        </span>
      );
    }


    if (isExternal) {
      return (
        <a
          ref={ref}
          href={hrefStr}
          className={linkClassName}
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {children}
        </a>
      );
    }


    return (
      <Link
        ref={ref}
        href={hrefStr}
        className={linkClassName}
        {...props}
      >
        {children}
      </Link>
    );
  }
);

Anchor.displayName = "Anchor";

export default Anchor;
