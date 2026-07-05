"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import Anchor from "./Anchor";
import type { DocuRoute } from "../node/types";
import { cn } from "../node/utils";

interface SublinkProps extends DocuRoute {
  level: number;
  onNavigate?: () => void;
  parentHref?: string;
  pathname?: string;
}

export default function Sublink({
  title,
  href,
  items,
  noLink,
  level,
  onNavigate,
  parentHref = "",
  pathname: pathnameProp,
}: SublinkProps) {
  const fullHref = parentHref ? `${parentHref}${href}` : `/docs${href}`;
  const currentPathname =
    pathnameProp || (typeof window !== "undefined" ? window.location.pathname : "/docs");

  const [isOpen, setIsOpen] = useState(() => {
    if (level === 0) return true;
    if (!items) return false;
    return currentPathname.startsWith(fullHref) && currentPathname !== fullHref;
  });

  // Shared padding based on nesting level
  const levelPadding = cn(level === 1 && "pl-2", level === 2 && "pl-4", level >= 3 && "pl-6");
  const isActive = currentPathname === fullHref || currentPathname === `${fullHref}.html`;
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive && activeRef.current) {
      activeRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [isActive]);

  // Leaf node (no children)
  if (!items) {
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
        ref={activeRef}
        className={cn(
          "py-1",
          levelPadding,
          level >= 2 && "border-l-2",
          level >= 2 && (isActive ? "border-primary" : "border-base-300")
        )}
      >
        {link}
      </div>
    );
  }

  // Section with children
  return (
    <div ref={isActive ? activeRef : undefined} className={cn("flex flex-col", levelPadding)}>
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
        <div className="flex flex-col py-1">
          {items.map((item) => (
            <Sublink
              key={`${fullHref}${item.href}`}
              {...item}
              href={item.href}
              level={level + 1}
              onNavigate={onNavigate}
              parentHref={fullHref}
              pathname={pathnameProp}
            />
          ))}
        </div>
      )}
    </div>
  );
}
