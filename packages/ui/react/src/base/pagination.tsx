import { cn } from "../utils/cn";
import type { ReactNode } from "react";

export interface PaginationDocsProps {
  prev?: { href: string; title: string };
  next?: { href: string; title: string };
  className?: string;
  prevIcon?: ReactNode;
  nextIcon?: ReactNode;
  linkClassName?: string;
}

export function PaginationDocs({
  prev,
  next,
  className,
  prevIcon,
  nextIcon,
  linkClassName,
}: PaginationDocsProps) {
  const linkBase =
    "flex flex-col no-underline rounded-lg border border-base-300 bg-base-100 transition-colors hover:bg-base-200 hover:border-base-300";
  return (
    <div className={cn("grid grow grid-cols-1 gap-4 py-8 sm:grid-cols-2", className)}>
      <div>
        {prev && (
          <a href={prev.href} className={cn(linkBase, "items-start px-4 py-4", linkClassName)}>
            <span className="text-muted-foreground flex items-center justify-start text-xs">
              {prevIcon && <span className="mr-1">{prevIcon}</span>}
              Previous
            </span>
            <span className="text-base-content mt-1 text-sm font-medium">{prev.title}</span>
          </a>
        )}
      </div>
      <div>
        {next && (
          <a
            href={next.href}
            className={cn(linkBase, "items-end px-4 py-4 text-right", linkClassName)}
          >
            <span className="text-muted-foreground flex items-center justify-end text-xs">
              Next
              {nextIcon && <span className="ml-1">{nextIcon}</span>}
            </span>
            <span className="text-base-content mt-1 text-sm font-medium">{next.title}</span>
          </a>
        )}
      </div>
    </div>
  );
}
