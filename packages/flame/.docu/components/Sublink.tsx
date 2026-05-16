"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Anchor from "./Anchor";
import type { DocuRoute } from "../lib/types";
import { cn } from "../lib/utils";

interface SublinkProps extends DocuRoute {
  level: number;
  onNavigate?: () => void;
  parentHref?: string;
}

export default function Sublink({
  title,
  href,
  items,
  noLink,
  level,
  onNavigate,
  parentHref = "",
}: SublinkProps) {
  const fullHref = parentHref ? `${parentHref}${href}` : `/docs${href}`;

  const [isOpen, setIsOpen] = useState(() => {
    if (level === 0) return true;
    if (typeof window === "undefined" || !items) return false;
    const pathname = window.location.pathname;
    return pathname.startsWith(fullHref) && pathname !== fullHref;
  });

  // Leaf node (no children)
  if (!items) {
    const isActive =
      typeof window !== "undefined" &&
      (window.location.pathname === fullHref || window.location.pathname === `${fullHref}.html`);

    const link = (
      <Anchor
        href={fullHref}
        className="text-foreground hover:text-foreground/80 text-sm transition-colors"
        activeClassName="text-primary font-medium"
        activeWhen={(path) => path === fullHref || path === `${fullHref}.html`}
        onClick={onNavigate}
      >
        {title}
      </Anchor>
    );
    return (
      <div
        className={cn(
          "py-1.5",
          level >= 2 && "border-l-2 pl-3",
          level >= 2 && (isActive ? "border-primary" : "border-base-300")
        )}
      >
        {link}
      </div>
    );
  }

  // Section with children
  return (
    <div className="flex flex-col">
      {/* Section header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full cursor-pointer items-center justify-between py-1 text-left text-sm transition-colors",
          noLink
            ? "text-base-content font-semibold"
            : "text-base-content/80 hover:text-base-content font-medium"
        )}
      >
        {noLink ? (
          <span>{title}</span>
        ) : (
          <Anchor
            href={fullHref}
            className="text-foreground hover:text-foreground/80 transition-colors"
            activeClassName="text-primary"
            activeWhen={(path) => path === fullHref || path === `${fullHref}.html`}
            onClick={onNavigate}
          >
            {title}
          </Anchor>
        )}
        <ChevronDown
          className={cn(
            "text-base-content/40 h-4 w-4 shrink-0 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Children */}
      {isOpen && (
        <div className="flex flex-col py-1.5">
          {items.map((item) => (
            <Sublink
              key={`${fullHref}${item.href}`}
              {...item}
              href={item.href}
              level={level + 1}
              onNavigate={onNavigate}
              parentHref={fullHref}
            />
          ))}
        </div>
      )}
    </div>
  );
}
