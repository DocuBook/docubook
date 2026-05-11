"use client";

import { useState, useEffect } from "react";
import { cn } from "../lib/utils";
import { Dropdown, DropdownItem } from "./base/dropdown";
import { routes } from "../lib/route";
import { ChevronRight, Check, type LucideIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";

interface ContextProps {
  className?: string;
}

function getContextRoutes() {
  return routes.filter((route) => route.context);
}

function getFirstItemHref(route: { href: string; items?: { href: string }[] }): string {
  return route.items?.[0]?.href ? `${route.href}${route.items[0].href}` : route.href;
}

function getActiveContextRoute(path: string) {
  const docPath = path.replace(/^\/docs/, "");
  return getContextRoutes().find((route) => docPath.startsWith(route.href));
}

function getIcon(name: string): LucideIcon {
  const Icon = LucideIcons[name as keyof typeof LucideIcons] as LucideIcon | undefined;
  return Icon || LucideIcons.FileQuestion;
}

export function Context({ className }: ContextProps) {
  const [pathname, setPathname] = useState("/");
  const [mounted, setMounted] = useState(false);
  const [activeRoute, setActiveRoute] = useState<{
    href: string;
    title: string;
    context?: { title?: string; icon?: string; description?: string };
  }>();
  const contextRoutes = getContextRoutes();
  const fallbackRoute = routes[0];
  const displayRoute = activeRoute || fallbackRoute;

  useEffect(() => {
    setPathname(window.location.pathname);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (pathname.startsWith("/docs")) {
      setActiveRoute(getActiveContextRoute(pathname));
    } else {
      setActiveRoute(undefined);
    }
  }, [pathname]);

  if (!mounted || !pathname.startsWith("/docs") || contextRoutes.length === 0) {
    return null;
  }

  const navigate = (href: string) => {
    window.location.href = href;
  };

  return (
    <Dropdown
      className={cn("w-full", className)}
      align="start"
      trigger={
        <div className="flex items-center justify-between truncate text-sm font-semibold">
          <div className="flex min-w-0 items-center gap-2">
            {displayRoute?.context?.icon && (
              <span className="text-primary bg-primary/10 border-primary flex-shrink-0 rounded border p-0.5">
                {(() => {
                  const Icon = getIcon(displayRoute.context.icon);
                  return <Icon className="h-4 w-4" />;
                })()}
              </span>
            )}
            <span className="truncate">{displayRoute?.context?.title || displayRoute?.title}</span>
          </div>
          <ChevronRight className="text-base-content/50 h-4 w-4 flex-shrink-0 [&_svg]:rotate-90 rtl:[&_svg]:-rotate-90" />
        </div>
      }
    >
      {contextRoutes.map((route) => {
        const isActive = activeRoute?.href === route.href;
        const firstItemPath = getFirstItemHref(route);
        const contextPath = `/docs${firstItemPath}`;

        return (
          <DropdownItem
            key={route.href}
            onClick={() => navigate(contextPath)}
            className={cn(
              "relative flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-sm",
              "text-left outline-none transition-colors",
              isActive
                ? "bg-primary/20 text-primary"
                : "hover:bg-base-200 text-base-content/80 hover:text-base-content"
            )}
          >
            {route.context?.icon && (
              <span
                className={cn(
                  "flex h-4 w-4 flex-shrink-0 items-center justify-center",
                  isActive ? "text-primary" : "text-base-content/60"
                )}
              >
                {(() => {
                  const Icon = getIcon(route.context.icon);
                  return <Icon className="h-4 w-4" />;
                })()}
              </span>
            )}
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="truncate font-medium">{route.context?.title || route.title}</div>
              {route.context?.description && (
                <div className="text-base-content/50 max-w-full overflow-hidden truncate text-ellipsis text-xs">
                  {route.context.description}
                </div>
              )}
            </div>
            {isActive && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
          </DropdownItem>
        );
      })}
    </Dropdown>
  );
}
