"use client";

import { ROUTES, EachRoute } from "@/lib/routes-config";
import SubLink from "./sublink";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface DocsMenuProps {
  isSheet?: boolean;
  className?: string;
}

// Get the current context from the path
function getCurrentContext(path: string): string | undefined {
  if (!path.startsWith('/docs')) return undefined;

  // Extract the first segment after /docs/
  const match = path.match(/^\/docs\/([^\/]+)/);
  return match ? match[1] : undefined;
}

// Get the route that matches the current context
function getContextRoute(contextPath: string): EachRoute | undefined {
  return ROUTES.find(route => {
    const normalizedHref = route.href.replace(/^\/+|\/+$/g, '');
    return normalizedHref === contextPath;
  });
}

export default function DocsMenu({ isSheet = false, className = "" }: DocsMenuProps) {
  const pathname = usePathname();

  // Skip rendering if not on a docs page
  if (!pathname.startsWith("/docs")) return null;

  // Get the current context
  const currentContext = getCurrentContext(pathname);

  // Get the route for the current context
  const contextRoute = currentContext ? getContextRoute(currentContext) : undefined;

  // If no context route is found, don't render anything
  if (!contextRoute) return null;

  return (
    <nav
      aria-label="Documentation navigation"
      className={cn("transition-all duration-200", className)}
    >
      <ul className="flex flex-col gap-1.5 py-4">
        {/* Display only the items from the current context */}
        <li key={contextRoute.title}>
          <SubLink
            {...contextRoute}
            href={`/docs${contextRoute.href}`}
            level={0}
            isSheet={isSheet}
          />
        </li>
      </ul>
    </nav>
  );
}
