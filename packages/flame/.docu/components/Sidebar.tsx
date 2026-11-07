"use client";

import { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import {
  ChevronDown,
  ChevronUp,
  EllipsisVertical,
  PanelRight,
  PanelRightClose,
} from "lucide-react";
import { Dropdown } from "@docubook/ui-react/dropdown";
import { cn, docsAssetSrc, docsNavActive, docsNavHref, withDeployPath } from "../node/utils";
import Anchor from "./Anchor";
import { Context } from "./Context";
import Menu from "./Menu";
import { ThemeToggle } from "./Theme";
import { GitHubLink } from "./Navbar";
import Search, { AskAiButton, useAskAi } from "./Search";
import { TocProgressCircle, tocProgress } from "./TocProgress";
import { revealScrollTop } from "./toc-list-scroll";
import type { TocItem } from "../node/types";
import { config as docuConfig, routes, basePath, deployPath } from "../node/client-routes";

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
  const askAi = useAskAi();
  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center px-5">
        <a href={withDeployPath(basePath || "/", deployPath)} className="flex items-center gap-2">
          {docuConfig.navbar?.logo?.src && (
            <img
              src={docsAssetSrc(docuConfig.navbar.logo.src, basePath, deployPath)}
              alt={docuConfig.navbar.logo.alt || ""}
              className="h-6 w-6"
            />
          )}
          {docuConfig.navbar?.logoText && (
            <span className="text-primary text-lg font-semibold">{docuConfig.navbar.logoText}</span>
          )}
        </a>
      </div>

      {/* Search, plus Ask AI when the search plugin offers it */}
      <div className="flex shrink-0 items-center gap-2 px-4 pb-3">
        <Search className="min-w-0 flex-1" />
        {askAi && <AskAiButton config={askAi} />}
      </div>

      {/* Context + Menu */}
      <div className="flex-1 overflow-y-auto px-4">
        <Context className="mb-2" />
        <Menu routes={routes} />
      </div>

      {/* Bottom: Theme + GitHub */}
      <div className="border-base-200 flex items-center justify-between border-t px-4 py-3">
        <ThemeToggle />
        <GitHubLink repoUrl={repoUrl} />
      </div>
    </div>
  );
}

export function MobileBar({
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
  // Share of sections reached, for the progress circle beside the title
  const [progress, setProgress] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tocs.length) return;

    // Match the CSS scroll-margin-top (scroll-mt-54 = 216px) that anchor
    // jumps rest at, so the highlight agrees with where a jump lands.
    const firstEl = document.getElementById(tocs[0].href.slice(1));
    const offset = firstEl ? parseFloat(getComputedStyle(firstEl).scrollMarginTop) || 100 : 100;

    const handleScroll = () => {
      let currentId: string | null = null;
      let currentIndex = -1;
      for (const [index, toc] of tocs.entries()) {
        const id = toc.href.slice(1);
        const el = document.getElementById(id);
        if (!el) continue;
        // Round: smooth anchor scrolls land at sub-pixel positions (e.g.
        // 216.4px), which would otherwise fail the <= offset comparison and
        // leave the previous heading highlighted.
        if (Math.round(el.getBoundingClientRect().top) <= offset) {
          currentId = id;
          currentIndex = index;
        } else {
          break;
        }
      }
      // Above the first heading nothing is active, as on the desktop TOC: the
      // bar shows the page title, matching a progress of 0.
      setActiveId(currentId);
      const root = document.documentElement;
      const atEnd = window.innerHeight + window.scrollY >= root.scrollHeight - 2;
      setProgress(tocProgress(currentIndex, tocs.length, atEnd));
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    // Smooth anchor scrolls may not emit a trailing scroll event at the
    // target position — recompute once the animation actually settles.
    window.addEventListener("scrollend", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("scrollend", handleScroll);
    };
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

  // Scroll the open list so the active heading shows. The list is a sibling
  // of the page, so this sets its scrollTop instead of calling
  // scrollIntoView, which would also scroll the window.
  const revealActive = useCallback((align: "center" | "nearest") => {
    const list = listRef.current;
    const entry = list?.querySelector<HTMLElement>('[aria-current="location"]');
    if (!list || !entry) return;
    const listRect = list.getBoundingClientRect();
    const entryRect = entry.getBoundingClientRect();
    const top = revealScrollTop(
      {
        top: listRect.top + list.clientTop,
        height: list.clientHeight,
        scrollTop: list.scrollTop,
        scrollHeight: list.scrollHeight,
      },
      { top: entryRect.top, height: entryRect.height },
      align
    );
    if (top !== null) list.scrollTop = top;
  }, []);

  // Open at the active heading, before the first paint, so a long list does
  // not flash its top when the reader is near the end of the page.
  useLayoutEffect(() => {
    if (tocExpanded) revealActive("center");
  }, [tocExpanded, revealActive]);

  // While the list stays open, follow the active heading as the page moves.
  useEffect(() => {
    if (tocExpanded) revealActive("nearest");
  }, [activeId, tocExpanded, revealActive]);

  const activeSection = tocs.find((t) => t.href.slice(1) === activeId);
  const hasToc = tocs.length > 0;
  const displayTitle = activeSection?.text || title || "On this page";
  const toggleToc = useCallback(() => setTocExpanded((p) => !p), []);

  return (
    <div ref={barRef} className="z-50 lg:hidden">
      <div className="border-base-200 bg-base-100/80 border-b shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-1 p-2">
          <Dropdown
            align="start"
            menuClassName="w-52 min-w-0"
            trigger={
              <span className="btn btn-ghost btn-sm btn-square">
                <EllipsisVertical className="text-base-content/60 h-5 w-5" />
              </span>
            }
          >
            {(docuConfig.navbar?.menu || []).map((item) => {
              const href = docsNavHref(item.href, basePath, deployPath);
              return (
                <li
                  key={item.href}
                  role="menuitem"
                  className="text-base-content/80 hover:text-base-content hover:bg-base-200 cursor-pointer"
                >
                  <Anchor
                    href={href}
                    activeWhen={(path: string) => docsNavActive(path, href)}
                    activeClassName="text-primary font-semibold"
                    className="block rounded px-2 py-2 text-sm"
                  >
                    {item.title}
                  </Anchor>
                </li>
              );
            })}
          </Dropdown>

          {hasToc ? (
            <button
              type="button"
              onClick={toggleToc}
              // -ml-1 cancels the row gap, so this button starts where the 32px
              // menu trigger ends: no dead strip between them and no overlap.
              // pl-1 keeps the ring close to the menu dots.
              className="btn btn-ghost btn-sm -ml-1 min-w-0 flex-1 justify-between pl-1"
              aria-expanded={tocExpanded}
              aria-label={`${tocExpanded ? "Collapse" : "Expand"} table of contents, ${Math.round(progress * 100)}% of sections read`}
            >
              <span className="flex min-w-0 items-center gap-2">
                <TocProgressCircle value={progress} />
                <span className="truncate text-sm font-medium">{displayTitle}</span>
              </span>
              {tocExpanded ? (
                <ChevronUp className="text-base-content/50 h-4 w-4 shrink-0" />
              ) : (
                <ChevronDown className="text-base-content/50 h-4 w-4 shrink-0" />
              )}
            </button>
          ) : (
            <span className="-ml-1 min-w-0 flex-1 truncate pl-1 text-sm font-medium">
              {displayTitle}
            </span>
          )}

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

        {hasToc && tocExpanded && (
          // overscroll-contain: reaching either end of the list must not
          // scroll the page behind it, which would also change the active
          // heading under the reader's finger.
          <div
            ref={listRef}
            data-toc-list=""
            className="border-base-200 max-h-[60vh] overflow-y-auto overscroll-contain border-t px-4 py-2"
          >
            <MobileTocList
              tocs={tocs}
              activeId={activeId}
              onSelect={(id) => {
                setTocExpanded(false);
                setActiveId(id);
              }}
            />
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
  onSelect: (id: string) => void;
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
              aria-current={isActive ? "location" : undefined}
              onClick={(e) => {
                e.preventDefault();
                onSelect(id);
                history.replaceState(null, "", toc.href);
                const targetId = id;
                // Wait for the bar collapse re-render so the measurement is
                // accurate, then jump with the same offset the observer uses
                // (scrollIntoView ignores scroll-margin-top on iOS Safari).
                requestAnimationFrame(() => {
                  const el = document.getElementById(targetId);
                  if (!el) return;
                  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 100;
                  window.scrollTo({
                    top: el.getBoundingClientRect().top + window.scrollY - margin,
                    behavior: "smooth",
                  });
                });
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
  const askAi = useAskAi();

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
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="bg-base-100 absolute top-0 right-0 flex h-full w-80 max-w-[85vw] flex-col shadow-xl">
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
        {askAi && (
          <div className="border-base-200 border-b px-4 py-3">
            {/* Close the drawer first: the panel opens over the page, not over the drawer */}
            <AskAiButton config={askAi} variant="block" onBeforeOpen={onClose} />
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          <Context className="mb-2" />
          <Menu onNavigate={onClose} routes={routes} />
        </div>
      </div>
    </div>
  );
}
