"use client";

import { type HTMLAttributes, type ReactNode, forwardRef, useRef, useEffect } from "react";
import { cn } from "../utils/cn";

export interface DropdownProps extends HTMLAttributes<HTMLDetailsElement> {
  align?: "start" | "end";
  disabled?: boolean;
  trigger?: ReactNode;
  children?: ReactNode;
  menuClassName?: string;
}

export const Dropdown = forwardRef<HTMLDetailsElement, DropdownProps>(
  (
    { className, align = "start", disabled = false, trigger, children, menuClassName, ...props },
    ref
  ) => {
    const detailsRef = useRef<HTMLDetailsElement>(null);

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
        <summary className="cursor-pointer" style={{ listStyle: "none" }}>
          {trigger}
        </summary>
        <ul
          className={cn(
            "bg-base-100 rounded-box border-base-300 absolute z-50 mt-1 min-w-[240px] space-y-1 border p-2 shadow-lg",
            align === "end" ? "right-0" : "left-0",
            menuClassName
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
    <li
      ref={ref}
      className={cn(
        "hover:bg-base-200 text-base-content/80 hover:text-base-content relative flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-sm outline-none transition-colors",
        className
      )}
      role="menuitem"
      {...props}
    >
      {children}
    </li>
  )
);
DropdownItem.displayName = "DropdownItem";

export const DropdownLink = forwardRef<
  HTMLAnchorElement,
  HTMLAttributes<HTMLAnchorElement> & { href?: string }
>(({ className, children, href, ...props }, ref) => (
  <li
    role="menuitem"
    className="hover:bg-base-200 text-base-content/80 hover:text-base-content relative flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-sm outline-none transition-colors"
  >
    <a ref={ref} href={href} className={cn("text-inherit no-underline", className)} {...props}>
      {children}
    </a>
  </li>
));
DropdownLink.displayName = "DropdownLink";
