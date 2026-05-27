"use client";

import { cn } from "../cn";
import { useState, type ReactNode } from "react";

type CollapseVariant = "arrow" | "plus";

interface CollapseProps {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: CollapseVariant;
  className?: string;
  titleClassName?: string;
  contentClassName?: string;
  disabled?: boolean;
}

export function Collapse({
  title,
  children,
  defaultOpen = false,
  onOpenChange,
  variant = "arrow",
  className,
  titleClassName,
  contentClassName,
  disabled = false,
}: CollapseProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleToggle = () => {
    if (disabled) {
      return;
    }
    const newState = !isOpen;
    setIsOpen(newState);
    onOpenChange?.(newState);
  };

  return (
    <div
      className={cn(
        "bg-base-100 border-base-200 collapse rounded-lg border",
        isOpen && "collapse-open",
        !isOpen && "collapse-close",
        variant === "arrow" ? "collapse-arrow" : "collapse-plus",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <input
        type="checkbox"
        checked={isOpen}
        onChange={handleToggle}
        disabled={disabled}
        aria-expanded={isOpen}
      />
      <div
        className={cn(
          "collapse-title text-base-content cursor-pointer font-medium",
          titleClassName
        )}
        onClick={handleToggle}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            handleToggle();
          }
        }}
      >
        {title}
      </div>
      <div className={cn("collapse-content text-base-content/80", contentClassName)}>
        {children}
      </div>
    </div>
  );
}

interface AccordionItem {
  id: string;
  title: ReactNode;
  content: ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  defaultOpen?: string;
  variant?: CollapseVariant;
  className?: string;
  allowMultiple?: boolean;
}

export function Accordion({
  items,
  defaultOpen,
  variant = "arrow",
  className,
  allowMultiple = false,
}: AccordionProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(
    defaultOpen ? new Set([defaultOpen]) : new Set()
  );

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (!allowMultiple) {
          next.clear();
        }
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            "bg-base-100 border-base-200 collapse rounded-lg border",
            openIds.has(item.id) && "collapse-open",
            !openIds.has(item.id) && "collapse-close",
            variant === "arrow" ? "collapse-arrow" : "collapse-plus"
          )}
        >
          <input type="checkbox" checked={openIds.has(item.id)} onChange={() => toggle(item.id)} />
          <div
            className="collapse-title text-base-content cursor-pointer font-medium"
            onClick={() => toggle(item.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggle(item.id);
              }
            }}
          >
            {item.title}
          </div>
          <div className="collapse-content text-base-content/80">{item.content}</div>
        </div>
      ))}
    </div>
  );
}

export type { CollapseProps, CollapseVariant, AccordionItem, AccordionProps };
