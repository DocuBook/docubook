"use client";

import { useState } from "react";
import { cn, docsHtmlHref } from "../node/utils";
import { Dropdown, DropdownItem } from "@docubook/ui-react/dropdown";
import { routes, config as docuConfig } from "../node/client-routes";
import { ChevronsUpDown, Check } from "lucide-react";
import { renderLucideIcon } from "./Lucide";

interface ContextProps {
  className?: string;
}

function getContextRoutes() {
  return routes.filter((route) => route.context);
}

function getFirstItemHref(route: { href: string; items?: { href: string }[] }): string {
  if (!route.items?.length) return route.href;
  return `${route.href}${getFirstItemHref(route.items[0])}`;
}

function getActiveContextRoute(path: string) {
  const docPath = path.replace(/^\/docs/, "");
  return getContextRoutes().find((route) => docPath.startsWith(route.href));
}

export function Context({ className }: ContextProps) {
  const [pathname] = useState(() =>
    typeof window !== "undefined" ? window.location.pathname : "/"
  );
  const mounted = typeof window !== "undefined";

  const mode = docuConfig.sidebar?.context || "dropdown";
  if (mode === "separator") return null;
  const activeRoute = pathname.startsWith("/docs") ? getActiveContextRoute(pathname) : undefined;
  const contextRoutes = getContextRoutes();
  const fallbackRoute = routes[0];
  const displayRoute = activeRoute || fallbackRoute;

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
      menuClassName="w-full"
      trigger={
        <div className="border-base-300 flex items-center justify-between rounded-lg border px-3 py-2 text-sm font-semibold">
          <div className="flex min-w-0 items-center gap-2">
            {displayRoute?.context?.icon && (
              <span className="text-primary bg-primary/10 border-primary flex-shrink-0 rounded border p-0.5">
                {renderLucideIcon(displayRoute.context.icon, "h-4 w-4")}
              </span>
            )}
            <span className="truncate">{displayRoute?.context?.title || displayRoute?.title}</span>
          </div>
          <ChevronsUpDown className="text-base-content/50 h-4 w-4 flex-shrink-0" />
        </div>
      }
    >
      {contextRoutes.map((route) => {
        const isActive = activeRoute?.href === route.href;
        const firstItemPath = getFirstItemHref(route);
        const contextPath = docsHtmlHref(`/docs${firstItemPath}`);

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
                {renderLucideIcon(route.context.icon)}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="font-medium">{route.context?.title || route.title}</div>
              {route.context?.description && (
                <div className="text-base-content/50 line-clamp-2 text-xs">
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
