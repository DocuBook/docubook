"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronDown, ChevronUp, PanelRight, PanelRightClose, FileText } from "lucide-react";
import { cn } from "../lib/utils";
import { Context } from "./Context";
import Menu from "./Menu";
import { ThemeToggle } from "./Theme";
import { GitHubLink } from "./Navbar";
import Search from "./Search";
import type { TocItem } from "../lib/types";
import docuConfig from "../../docu.json" with { type: "json" };

interface SidebarProps {
  tocs?: TocItem[];
  title?: string;
  repoUrl?: string;
  className?: string;
}

export default function Sidebar({ tocs = [], title, repoUrl, className }: SidebarProps) {
  return (
    <>
      <DesktopSidebar className={className} repoUrl={repoUrl} />
      <MobileBar tocs={tocs} title={title} repoUrl={repoUrl} />
    </>
  );
}

function DesktopSidebar({ className, repoUrl }: { className?: string; repoUrl?: string }) {
  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center px-5">
        <a href="/docs" className="flex items-center gap-2">
          {docuConfig.navbar?.logo?.src && (
            <img
              src={docuConfig.navbar.logo.src}
              alt={docuConfig.navbar.logo.alt || ""}
              className="h-6 w-6"
            />
          )}
          {docuConfig.navbar?.logoText && (
            <span className="text-primary text-lg font-semibold">{docuConfig.navbar.logoText}</span>
          )}
        </a>
      </div>

      {/* Search */}
      <div className="shrink-0 px-4 pb-3">
        <Search className="w-full" />
      </div>

      {/* Context + Menu */}
      <div className="flex-1 overflow-y-auto px-4">
        <Context className="mb-2" />
        <Menu />
      </div>

      {/* Bottom: Theme + GitHub */}
      <div className="border-base-200 flex items-center justify-between border-t px-4 py-3">
        <ThemeToggle />
        <GitHubLink repoUrl={repoUrl} />
      </div>
    </div>
  );
}

function MobileBar({
  tocs,
  title,
  repoUrl,
}: {
  tocs: TocItem[];
  title?: string;
  repoUrl?: string;
}) {
  const [tocExpanded, setTocExpanded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tocs.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );
    tocs.forEach((toc) => {
      const el = document.getElementById(toc.href.slice(1));
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [tocs]);

  useEffect(() => {
    if (!tocExpanded) return;
    const handler = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setTocExpanded(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [tocExpanded]);

  const activeSection = tocs.find((t) => t.href.slice(1) === activeId);
  const displayTitle = activeSection?.text || title || "On this page";
  const toggleToc = useCallback(() => setTocExpanded((p) => !p), []);

  return (
    <div ref={barRef} className="sticky top-0 z-50 lg:hidden">
      <div className="border-base-200 bg-base-100/95 border-b backdrop-blur-sm">
        <div className="flex items-center gap-1 p-2">
          <button
            type="button"
            onClick={toggleToc}
            className="btn btn-ghost btn-sm min-w-0 flex-1 justify-between"
            aria-label={tocExpanded ? "Collapse table of contents" : "Expand table of contents"}
          >
            <span className="truncate text-sm font-medium">{displayTitle}</span>
            {tocExpanded ? (
              <ChevronUp className="text-base-content/50 h-4 w-4 shrink-0" />
            ) : (
              <ChevronDown className="text-base-content/50 h-4 w-4 shrink-0" />
            )}
          </button>

          <Search />

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="btn btn-ghost btn-sm btn-square"
            aria-label="Open navigation"
          >
            <PanelRight className="text-base-content/60 h-5 w-5" />
          </button>
        </div>

        {tocExpanded && (
          <div className="border-base-200 max-h-[60vh] overflow-y-auto border-t px-4 py-2">
            {tocs.length > 0 ? (
              <MobileTocList
                tocs={tocs}
                activeId={activeId}
                onSelect={() => setTocExpanded(false)}
              />
            ) : (
              <div className="flex flex-col items-center py-6 text-center">
                <FileText className="text-base-content/30 mb-2 h-7 w-7" />
                <p className="text-base-content/50 text-sm">No headings on this page</p>
              </div>
            )}
          </div>
        )}
      </div>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} repoUrl={repoUrl} />
    </div>
  );
}

function MobileTocList({
  tocs,
  activeId,
  onSelect,
}: {
  tocs: TocItem[];
  activeId: string | null;
  onSelect: () => void;
}) {
  return (
    <ul className="flex flex-col gap-0.5">
      {tocs.map((toc) => {
        const id = toc.href.slice(1);
        const isActive = activeId === id;
        const indent = (toc.level - 2) * 12;
        return (
          <li key={toc.href}>
            <a
              href={toc.href}
              onClick={(e) => {
                e.preventDefault();
                onSelect();
                const el = document.getElementById(id);
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className={cn(
                "block rounded px-2 py-1.5 text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-base-content/70 hover:text-base-content hover:bg-base-200"
              )}
              style={{ paddingLeft: `${indent + 8}px` }}
            >
              {toc.text}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function MobileDrawer({
  open,
  onClose,
  repoUrl,
}: {
  open: boolean;
  onClose: () => void;
  repoUrl?: string;
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="bg-base-100 absolute right-0 top-0 flex h-full w-80 max-w-[85vw] flex-col shadow-xl">
        <div className="border-base-200 flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <GitHubLink repoUrl={repoUrl} />
            <ThemeToggle />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-square"
            aria-label="Close navigation"
          >
            <PanelRightClose className="text-base-content/60 h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-2">
          <Context className="mb-2" />
          <Menu onNavigate={onClose} />
        </div>
      </div>
    </div>
  );
}
