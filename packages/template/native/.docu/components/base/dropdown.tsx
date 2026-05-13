"use client";

import { type HTMLAttributes, type ReactNode, forwardRef, useRef, useEffect } from "react";
import { cn } from "../../lib/utils";

export interface DropdownProps extends HTMLAttributes<HTMLDetailsElement> {
  align?: "start" | "end";
  disabled?: boolean;
  trigger?: ReactNode;
  children?: ReactNode;
}

export const Dropdown = forwardRef<HTMLDetailsElement, DropdownProps>(
  ({ className, align = "start", disabled = false, trigger, children, ...props }, ref) => {
    const detailsRef = useRef<HTMLDetailsElement>(null);

    // Close on click outside
    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (detailsRef.current && !detailsRef.current.contains(e.target as Node)) {
          detailsRef.current.open = false;
        }
      };
      document.addEventListener("click", handler);
      return () => document.removeEventListener("click", handler);
    }, []);

    return (
      <details
        ref={(el) => {
          (detailsRef as React.MutableRefObject<HTMLDetailsElement | null>).current = el;
          if (typeof ref === "function") ref(el);
          else if (ref) ref.current = el;
        }}
        className={cn("relative", disabled && "pointer-events-none opacity-50", className)}
        {...props}
      >
        <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          {trigger}
        </summary>
        <ul
          className={cn(
            "bg-base-100 rounded-box border-base-300 absolute z-50 mt-1 w-full min-w-[200px] border p-2 shadow-lg",
            align === "end" ? "right-0" : "left-0"
          )}
        >
          {children}
        </ul>
      </details>
    );
  }
);
Dropdown.displayName = "Dropdown";

export interface DropdownItemProps extends HTMLAttributes<HTMLLIElement> {
  children?: ReactNode;
}

export const DropdownItem = forwardRef<HTMLLIElement, DropdownItemProps>(
  ({ className, children, ...props }, ref) => (
    <li ref={ref} className={cn(className)} role="menuitem" {...props}>
      {children}
    </li>
  )
);
DropdownItem.displayName = "DropdownItem";

export const DropdownLink = forwardRef<
  HTMLAnchorElement,
  HTMLAttributes<HTMLAnchorElement> & { href?: string }
>(({ className, children, href, ...props }, ref) => (
  <li role="menuitem">
    <a ref={ref} href={href} className={cn(className)} {...props}>
      {children}
    </a>
  </li>
));
DropdownLink.displayName = "DropdownLink";

export const DropdownLabel = forwardRef<HTMLLIElement, HTMLAttributes<HTMLLIElement>>(
  ({ className, children, ...props }, ref) => (
    <li ref={ref} className={cn("menu-title", className)} {...props}>
      {children}
    </li>
  )
);
DropdownLabel.displayName = "DropdownLabel";

export const DropdownDivider = forwardRef<HTMLLIElement, HTMLAttributes<HTMLLIElement>>(
  ({ className, ...props }, ref) => (
    <li ref={ref} className={cn("border-base-200 my-1 border-t", className)} {...props} />
  )
);
DropdownDivider.displayName = "DropdownDivider";
