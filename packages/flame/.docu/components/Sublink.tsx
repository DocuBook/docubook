"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { ChevronDown } from "lucide-react";
import Anchor from "./Anchor";
import type { DocuRoute } from "../node/types";
import { cn, docsHtmlHref } from "../node/utils";
import { config as docuConfig } from "../node/client-routes";

/** Exclusive accordion for level >= 2 sidebar groups — opening one group
 * closes the previously open one. All level >= 2 groups default to closed
 * and expand only when the header is clicked. `open` is used to auto-expand
 * the group containing the active page. */
export const GroupAccordionContext = createContext<{
  openId: string | null;
  open: (id: string) => void;
  toggle: (id: string) => void;
}>({ openId: null, open: () => {}, toggle: () => {} });

export function GroupAccordionProvider({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);
  // Exclusive: expanding B closes A — only one group stays open at a time;
  // clicking the open group again collapses it.
  const open = useCallback((id: string) => setOpenId(id), []);
  const toggle = useCallback((id: string) => setOpenId((prev) => (prev === id ? null : id)), []);
  return (
    <GroupAccordionContext.Provider value={{ openId, open, toggle }}>
      {children}
    </GroupAccordionContext.Provider>
  );
}

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

  // Groups with children are exclusive accordions (default closed, expand on
  // click). In separator mode every nav item renders at level 0 (sections are
  // SidebarGroupHeader, not Sublinks), so depth can't tell them apart — the
  // mode does. In dropdown mode the top section is level 0 (stays open) and
  // everything deeper is an accordion.
  const isSeparator = docuConfig.sidebar?.context === "separator";
  const { openId, open, toggle } = useContext(GroupAccordionContext);
  const isAccordionGroup = Boolean(items) && (isSeparator || level >= 1);
  // Routes-tree level: separator mode renders every item at level 0 (sections
  // are SidebarGroupHeader), dropdown starts the context section at level 0.
  const treeLevel = level + (isSeparator ? 2 : 1);

  const [isOpen, setIsOpen] = useState(() => {
    if (isAccordionGroup) return false; // default closed — context controls it
    if (level === 0) return true; // top-level section stays open
    return false; // leaves
  });

  const effectiveOpen = isAccordionGroup ? openId === fullHref : isOpen;
  const handleToggle = () => {
    if (isAccordionGroup) toggle(fullHref);
    else setIsOpen((o) => !o);
  };

  // Auto-expand the accordion group that contains the active page — on mount
  // and whenever the current path changes. `open` is stable (useCallback), so
  // this only fires on real path changes; a manual collapse by the user is
  // respected until the path changes again.
  const isInsideActive = currentPathname.startsWith(fullHref) && currentPathname !== fullHref;
  useEffect(() => {
    if (isAccordionGroup && isInsideActive) open(fullHref);
  }, [isAccordionGroup, isInsideActive, fullHref, open]);

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
        onClick={handleToggle}
        className={cn(
          "flex w-full cursor-pointer items-center justify-between py-1 text-left text-sm transition-colors",
          // Only the top-level section label (routes-tree level 1) is bold.
          // Deeper groups (e.g. Search at level 2) are children that happen to
          // have items — style them like links, no header weight.
          noLink && treeLevel === 1
            ? "text-base-content font-semibold"
            : "text-foreground hover:text-foreground/80"
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
            // Tree convention: closed = chevron pointing right (expandable),
            // open = pointing down — a 90° turn instead of the 180° flip.
            effectiveOpen ? "rotate-0" : "-rotate-90"
          )}
        />
      </button>

      {/* Children */}
      {effectiveOpen && (
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
