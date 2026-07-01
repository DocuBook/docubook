"use client";

import { useState } from "react";
import Sublink from "./Sublink";
import SidebarGroupHeader from "./SidebarGroupHeader";
import type { DocuRoute } from "../node/types";
import { cn } from "../node/utils";
import { config as docuConfig } from "../node/client-routes";

interface MenuProps {
  onNavigate?: () => void;
  className?: string;
  pathname?: string;
  routes?: DocuRoute[];
}

function getCurrentContext(path: string): string | undefined {
  if (!path.startsWith("/docs")) return undefined;
  const match = path.match(/^\/docs\/([^/]+)/);
  return match ? match[1] : undefined;
}

function getContextRoute(contextPath: string, routeList: DocuRoute[]): DocuRoute | undefined {
  return routeList.find((route) => {
    const normalizedHref = route.href.replace(/^\/+|\/+$/, "");
    return normalizedHref === contextPath;
  });
}

export default function Menu({ onNavigate, className = "", pathname, routes = [] }: MenuProps) {
  const menuRoutes = routes;
  const [currentPath] = useState(
    () => pathname || (typeof window !== "undefined" ? window.location.pathname : "/docs")
  );

  if (!currentPath.startsWith("/docs")) return null;

  const mode = docuConfig.sidebar?.context || "dropdown";

  // Separator mode: render all context sections as group headers + nav items
  if (mode === "separator") {
    const contextRoutes = menuRoutes.filter((r) => r.context);

    // No context routes defined — fall back to flat list of all routes
    if (contextRoutes.length === 0) {
      return (
        <nav
          aria-label="Documentation navigation"
          className={cn("transition-all duration-200", className)}
        >
          <ul className="flex flex-col gap-1.5 py-4">
            {menuRoutes.map((route) => (
              <li key={route.href}>
                <Sublink
                  {...route}
                  href={route.href}
                  level={0}
                  onNavigate={onNavigate}
                  parentHref="/docs"
                />
              </li>
            ))}
          </ul>
        </nav>
      );
    }

    return (
      <nav
        aria-label="Documentation navigation"
        className={cn("transition-all duration-200", className)}
      >
        {contextRoutes.map((route, i) => (
          <div key={route.href} className={i > 0 ? "mt-6 lg:mt-8" : ""}>
            <SidebarGroupHeader
              icon={route.context?.icon}
              title={route.context?.title || route.title}
            />
            <ul className="border-base-300 flex flex-col gap-1.5 border-l-2 pb-0.5 pl-3 pt-0.5">
              {route.items?.map((item) => (
                <li key={item.href}>
                  <Sublink
                    {...item}
                    href={item.href}
                    level={0}
                    onNavigate={onNavigate}
                    parentHref={`/docs${route.href}`}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    );
  }

  // Dropdown mode: render only the active context section
  const isDocsRoot = currentPath === "/docs" || currentPath === "/docs/";
  const currentContext = isDocsRoot
    ? menuRoutes[0]?.href.replace(/^\/+|\/+$/, "")
    : getCurrentContext(currentPath);

  const contextRoute =
    isDocsRoot && menuRoutes[0]
      ? currentContext
        ? getContextRoute(currentContext, menuRoutes)
        : menuRoutes[0]
      : currentContext
        ? getContextRoute(currentContext, menuRoutes)
        : undefined;

  if (!contextRoute) return null;

  return (
    <nav
      aria-label="Documentation navigation"
      className={cn("transition-all duration-200", className)}
    >
      <ul className="flex flex-col gap-1.5 py-4">
        <li key={contextRoute.title}>
          <Sublink
            {...contextRoute}
            href={contextRoute.href}
            level={0}
            onNavigate={onNavigate}
            parentHref="/docs"
          />
        </li>
      </ul>
    </nav>
  );
}
