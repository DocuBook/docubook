"use client"

import {
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { cn } from "../../lib/utils"

export interface DropdownProps extends HTMLAttributes<HTMLDivElement> {
  placement?: "top" | "bottom" | "left" | "right"
  align?: "start" | "end"
  hover?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
  trigger?: ReactNode
  children?: ReactNode
}

const placementClasses = {
  top: "dropdown-top",
  bottom: "dropdown-bottom",
  left: "dropdown-left",
  right: "dropdown-right",
} as const

const alignClasses = {
  start: "dropdown-start",
  end: "dropdown-end",
} as const

export const Dropdown = forwardRef<HTMLDivElement, DropdownProps>(
  (
    {
      className,
      placement = "bottom",
      align = "start",
      hover = false,
      open: controlledOpen,
      onOpenChange,
      disabled = false,
      trigger,
      children,
      ...props
    },
    ref
  ) => {
    const [internalOpen, setInternalOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLUListElement>(null)

    const isControlled = controlledOpen !== undefined
    const isOpen = isControlled ? controlledOpen : internalOpen

    const setOpen = useCallback(
      (newOpen: boolean) => {
        if (isControlled) {
          onOpenChange?.(newOpen)
        } else {
          setInternalOpen(newOpen)
        }
      },
      [isControlled, onOpenChange]
    )

    const close = useCallback(() => setOpen(false), [setOpen])
    const toggle = useCallback(() => {
      if (!disabled) {
        setOpen(!isOpen)
      }
    }, [disabled, isOpen, setOpen])

    // Handle click outside
    useEffect(() => {
      if (!isOpen) return

      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          close()
        }
      }

      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [isOpen, close])

    // Handle escape key
    useEffect(() => {
      if (!isOpen) return

      const handleKeyDown = (event: globalThis.KeyboardEvent) => {
        if (event.key === "Escape") {
          close()
          triggerRef.current?.focus()
        }
      }

      document.addEventListener("keydown", handleKeyDown)
      return () => document.removeEventListener("keydown", handleKeyDown)
    }, [isOpen, close])

    const handleTriggerKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        toggle()
      } else if (event.key === "ArrowDown" && !isOpen) {
        event.preventDefault()
        setOpen(true)
      }
    }

    const handleTriggerBlur = () => {
      setTimeout(() => {
        if (!contentRef.current?.contains(document.activeElement)) {
          // closed
        }
      }, 100)
    }

    const classes = [
      "dropdown",
      placementClasses[placement],
      alignClasses[align],
      hover && "dropdown-hover",
      className,
    ]
      .filter(Boolean)
      .join(" ")

    return (
      <div
        ref={(el) => {
          containerRef.current = el
          if (typeof ref === "function") ref(el)
          else if (ref) ref.current = el
        }}
        className={cn(classes)}
        {...props}
      >
        {/* Trigger */}
        <div
          ref={triggerRef}
          tabIndex={disabled ? -1 : 0}
          role="button"
          aria-haspopup="true"
          aria-expanded={isOpen}
          onClick={toggle}
          onKeyDown={handleTriggerKeyDown}
          onBlur={handleTriggerBlur}
          className={cn(
            "[&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-primary [&:focus-visible]:ring-offset-2",
            disabled && "opacity-50 cursor-not-allowed pointer-events-none"
          )}
        >
          {trigger}
        </div>

        {/* Content */}
        <ul
          ref={contentRef}
          tabIndex={-1}
          role="menu"
          className={cn(
            "dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm",
            isOpen ? "visible" : "hidden"
          )}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              close()
              triggerRef.current?.focus()
            }
          }}
        >
          {children}
        </ul>
      </div>
    )
  }
)
Dropdown.displayName = "Dropdown"

export interface DropdownItemProps extends HTMLAttributes<HTMLLIElement> {
  children?: ReactNode
  disabled?: boolean
}

export const DropdownItem = forwardRef<HTMLLIElement, DropdownItemProps>(
  ({ className, children, disabled, ...props }, ref) => {
    return (
      <li
        ref={ref}
        className={cn(
          "rounded-sm",
          !disabled && "hover:bg-base-200 cursor-pointer",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none",
          className
        )}
        aria-disabled={disabled}
        {...props}
      >
        {children}
      </li>
    )
  }
)
DropdownItem.displayName = "DropdownItem"

export interface DropdownLinkProps extends HTMLAttributes<HTMLAnchorElement> {
  children?: ReactNode
  href?: string
  target?: string
  rel?: string
}

export const DropdownLink = forwardRef<HTMLAnchorElement, DropdownLinkProps>(
  ({ className, children, href, target, rel, ...props }, ref) => {
    return (
      <a
        ref={ref}
        href={href}
        target={target}
        rel={rel}
        className={cn("flex items-center gap-2 px-2 py-1.5 text-sm", className)}
        {...props}
      >
        {children}
      </a>
    )
  }
)
DropdownLink.displayName = "DropdownLink"

export interface DropdownLabelProps extends HTMLAttributes<HTMLSpanElement> {
  children?: ReactNode
}

export const DropdownLabel = forwardRef<HTMLSpanElement, DropdownLabelProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn("px-2 py-1.5 text-sm font-semibold", className)}
        {...props}
      >
        {children}
      </span>
    )
  }
)
DropdownLabel.displayName = "DropdownLabel"

export type DropdownDividerProps = HTMLAttributes<HTMLLIElement>

export const DropdownDivider = forwardRef<HTMLLIElement, DropdownDividerProps>(
  ({ className, ...props }, ref) => {
    return (
      <li
        ref={ref}
        className={cn("-mx-1 my-1 h-px bg-base-300", className)}
        role="separator"
        {...props}
      />
    )
  }
)
DropdownDivider.displayName = "DropdownDivider"