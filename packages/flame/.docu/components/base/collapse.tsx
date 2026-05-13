"use client";

import { cn } from "../../lib/utils";
import { ChevronDown, ChevronRight, Plus, Minus } from "lucide-react";
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

export default function Collapse({
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
    if (disabled) return;
    const newState = !isOpen;
    setIsOpen(newState);
    onOpenChange?.(newState);
  };

  const Icon = variant === "arrow" ? (isOpen ? ChevronDown : ChevronRight) : isOpen ? Minus : Plus;

  const variantClass = variant === "arrow" ? "collapse-arrow" : "collapse-plus";

  return (
    <div
      className={cn(
        "bg-base-100 border-base-200 collapse rounded-lg border",
        isOpen && "collapse-open",
        !isOpen && "collapse-close",
        variantClass,
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
            setIsOpen(!isOpen);
          }
        }}
      >
        <div className="flex items-center justify-between pr-8">
          <span className="flex-1">{title}</span>
          <Icon
            className={cn(
              "text-base-content/60 h-4 w-4 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
            aria-hidden="true"
          />
        </div>
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
      {items.map((item) => {
        const isOpen = openIds.has(item.id);
        const Icon =
          variant === "arrow" ? (isOpen ? ChevronDown : ChevronRight) : isOpen ? Minus : Plus;

        return (
          <div
            key={item.id}
            className={cn(
              "bg-base-100 border-base-200 collapse rounded-lg border",
              isOpen && "collapse-open",
              !isOpen && "collapse-close",
              variant === "arrow" ? "collapse-arrow" : "collapse-plus"
            )}
          >
            <input type="checkbox" checked={isOpen} onChange={() => toggle(item.id)} />
            <div
              className="collapse-title text-base-content cursor-pointer pr-8 font-medium"
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
              <div className="flex items-center justify-between">
                <span className="flex-1">{item.title}</span>
                <Icon
                  className={cn(
                    "text-base-content/60 h-4 w-4 transition-transform duration-200",
                    isOpen && "rotate-180"
                  )}
                  aria-hidden="true"
                />
              </div>
            </div>
            <div className="collapse-content text-base-content/80">{item.content}</div>
          </div>
        );
      })}
    </div>
  );
}

export { Collapse };
export type { CollapseProps, AccordionItem, AccordionProps };
