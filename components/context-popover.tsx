"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ROUTES, EachRoute } from "@/lib/routes-config";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import * as LucideIcons from "lucide-react";
import { ChevronsUpDown, Check, type LucideIcon } from "lucide-react";

interface ContextPopoverProps {
  className?: string;
}

// Get all root-level routes with context
function getContextRoutes(): EachRoute[] {
  return ROUTES.filter(route => route.context);
}

// Get the first item's href from a route
function getFirstItemHref(route: EachRoute): string {
  return route.items?.[0]?.href ? `${route.href}${route.items[0].href}` : route.href;
}

// Get the active context route from the current path
function getActiveContextRoute(path: string): EachRoute | undefined {
  if (!path.startsWith('/docs')) return undefined;
  const docPath = path.replace(/^\/docs/, '');
  return getContextRoutes().find(route => docPath.startsWith(route.href));
}

// Get icon component by name
function getIcon(name: string) {
  const Icon = LucideIcons[name as keyof typeof LucideIcons] as LucideIcon | undefined;
  if (!Icon) return <LucideIcons.FileQuestion className="h-4 w-4" />;
  return <Icon className="h-4 w-4" />;
}

export default function ContextPopover({ className }: ContextPopoverProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeRoute, setActiveRoute] = useState<EachRoute>();
  const contextRoutes = getContextRoutes();

  useEffect(() => {
    if (pathname.startsWith("/docs")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveRoute(getActiveContextRoute(pathname));
    } else {
      setActiveRoute(undefined);
    }
  }, [pathname]);

  if (!pathname.startsWith("/docs") || contextRoutes.length === 0) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "w-full max-w-[240px] cursor-pointer flex items-center justify-between font-semibold text-foreground px-0 pt-8",
            "hover:bg-transparent hover:text-foreground",
            className
          )}
        >
          <div className="flex items-center gap-2">
            {activeRoute?.context?.icon && (
              <span className="text-primary bg-primary/10 border border-primary dark:border dark:border-accent dark:bg-accent/10 dark:text-accent rounded p-0.5">
                {getIcon(activeRoute.context.icon)}
              </span>
            )}
            <span className="truncate text-sm">
              {activeRoute?.context?.title || activeRoute?.title || 'Select context'}
            </span>
          </div>
          <ChevronsUpDown className="h-4 w-4 text-foreground/50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-2"
        align="start"
        sideOffset={6}
      >
        <div className="space-y-1">
          {contextRoutes.map((route) => {
            const isActive = activeRoute?.href === route.href;
            const firstItemPath = getFirstItemHref(route);
            const contextPath = `/docs${firstItemPath}`;

            return (
              <button
                key={route.href}
                onClick={() => router.push(contextPath)}
                className={cn(
                  "relative flex w-full items-center gap-2 cursor-pointer rounded px-2 py-1.5 text-sm",
                  "text-left outline-none transition-colors",
                  isActive
                    ? "bg-primary/20 text-primary dark:bg-accent/20 dark:text-accent"
                    : "text-foreground/80 hover:bg-primary/20 dark:text-foreground/60 dark:hover:bg-accent/20"
                )}
              >
                {route.context?.icon && (
                  <span className={cn(
                    "flex h-4 w-4 items-center justify-center",
                    isActive ? "text-primary dark:text-accent" : "text-foreground/60"
                  )}>
                    {getIcon(route.context.icon)}
                  </span>
                )}
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="truncate font-medium">
                    {route.context?.title || route.title}
                  </div>
                  {route.context?.description && (
                    <div className="text-xs text-muted-foreground truncate text-ellipsis overflow-hidden max-w-full">
                      {route.context.description}
                    </div>
                  )}
                </div>
                {isActive && (
                  <Check className="h-3.5 w-3.5" />
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
