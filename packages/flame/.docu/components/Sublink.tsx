"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import Anchor from "./Anchor";
import type { DocuRoute } from "../node/types";
import { cn, docsHtmlHref } from "../node/utils";
import { config as docuConfig } from "../node/client-routes";

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
  const levelPadding = cn(level === 1 && "pl-4", level === 2 && "pl-8", level >= 3 && "pl-12");
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
        href={docsHtmlHref(fullHref)}
        className="text-foreground hover:text-foreground/80 text-sm transition-colors"
        activeClassName="text-primary font-medium"
        activeWhen={(path) => path === fullHref || path === `${fullHref}.html`}
        onClick={onNavigate}
      >
        {title}
      </Anchor>
    );

    // Level 0: border handled by Menu.tsx wrapper
    // Level 1+: border at natural indented position, follows levelPadding
    if (level >= 1) {
      // Separator mode: active border overlaps at ul's edge
      // Each parent section adds its levelPadding to the offset
      if (docuConfig.sidebar?.context === "separator") {
        // Calculate accumulated offset from ul's edge to this item's natural position
        // Base: ul border(2px) + pl-3(12px) = 14px
        // Each parent section adds: level 1→16px, level 2→32px, level 3+→48px
        const sectionOffsets: Record<number, number> = { 1: 16, 2: 32 };
        let overlap = 14;
        for (let l = 1; l < level; l++) {
          overlap += sectionOffsets[l] ?? 48;
        }

        return (
          <div
            ref={activeRef}
            className={cn("border-l-2", isActive ? "border-primary" : "border-transparent")}
            style={{ marginLeft: `-${overlap}px` }}
          >
            <div className={cn("py-1 pl-3", levelPadding)}>{link}</div>
          </div>
        );
      }

      return (
        <div
          ref={activeRef}
          className={cn(
            "py-1",
            levelPadding,
            "border-l-2",
            isActive ? "border-primary" : "border-base-300"
          )}
        >
          {link}
        </div>
      );
    }

    return (
      <div ref={activeRef} className={cn("py-1", levelPadding)}>
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
            href={docsHtmlHref(fullHref)}
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
