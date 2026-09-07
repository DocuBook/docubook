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

export interface DropdownItemProps extends Omit<
  HTMLAttributes<HTMLLIElement>,
  "onClick" | "onKeyDown"
> {
  children?: ReactNode;
  onSelect?: () => void;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLButtonElement>;
}

export const DropdownItem = forwardRef<HTMLLIElement, DropdownItemProps>(
  ({ className, children, onSelect, onClick, onKeyDown, ...props }, ref) => (
    <li ref={ref} role="none" {...props}>
      <button
        type="button"
        role="menuitem"
        onClick={(e) => {
          onClick?.(e);
          onSelect?.();
        }}
        onKeyDown={onKeyDown}
        className={cn(
          "hover:bg-base-200 text-base-content/80 hover:text-base-content relative flex w-full cursor-pointer items-center gap-2 rounded px-2 py-2 text-left text-sm transition-colors outline-none focus-visible:ring-2",
          className
        )}
      >
        {children}
      </button>
    </li>
  )
);
DropdownItem.displayName = "DropdownItem";

export const DropdownLink = forwardRef<
  HTMLAnchorElement,
  HTMLAttributes<HTMLAnchorElement> & { href?: string }
>(({ className, children, href, ...props }, ref) => (
  <li role="none" className="relative flex rounded outline-none">
    <a
      ref={ref}
      href={href}
      role="menuitem"
      className={cn(
        "hover:bg-base-200 text-base-content/80 hover:text-base-content flex w-full cursor-pointer items-center gap-2 rounded px-2 py-2 text-sm text-inherit no-underline transition-colors focus-visible:ring-2",
        className
      )}
      {...props}
    >
      {children}
    </a>
  </li>
));
DropdownLink.displayName = "DropdownLink";
