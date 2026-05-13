"use client";

import { useState } from "react";
import docuConfig from "../../docu.json" with { type: "json" };
import Sublink from "./Sublink";
import type { DocuRoute } from "../lib/types";
import { cn } from "../lib/utils";

interface MenuProps {
  onNavigate?: () => void;
  className?: string;
}

function getCurrentContext(path: string): string | undefined {
  if (!path.startsWith("/docs")) return undefined;
  const match = path.match(/^\/docs\/([^/]+)/);
  return match ? match[1] : undefined;
}

function getContextRoute(contextPath: string): DocuRoute | undefined {
  return docuConfig.routes?.find((route) => {
    const normalizedHref = route.href.replace(/^\/+|\/+$/, "");
    return normalizedHref === contextPath;
  });
}

export default function Menu({ onNavigate, className = "" }: MenuProps) {
  const [currentPath] = useState(() =>
    typeof window !== "undefined" ? window.location.pathname : "/"
  );
  const mounted = typeof window !== "undefined";

  if (!mounted || !currentPath.startsWith("/docs")) return null;

  const isDocsRoot = currentPath === "/docs" || currentPath === "/docs/";
  const currentContext = isDocsRoot
    ? docuConfig.routes?.[0]?.href.replace(/^\/+|\/+$/, "")
    : getCurrentContext(currentPath);

  const contextRoute = currentContext ? getContextRoute(currentContext) : undefined;

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
