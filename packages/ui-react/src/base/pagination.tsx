import { cn } from "../utils/cn";
import type { ReactNode } from "react";

export interface PaginationDocsProps {
  prev?: { href: string; title: string };
  next?: { href: string; title: string; description?: string };
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
  return (
    <nav
      id="pagination"
      aria-label="Pagination"
      className={cn("bg-base-200/50 flex w-full gap-1 rounded-2xl p-1", className)}
    >
      {prev && (
        <a
          href={prev.href}
          rel="prev"
          data-component-part="pagination-prev"
          className={cn(
            "group text-muted-foreground hover:bg-base-200/60 hover:text-base-content flex items-center justify-start gap-1.5 rounded-xl px-3 py-3 text-sm no-underline transition-colors",
            // 30/70 split with next; calc subtracts half the gap so the two
            // cards plus gap-1 fill the pill exactly. No min-w-0: the card
            // floors at its content width, so a narrow screen never crushes
            // the icon/text into the next card.
            next && "w-[calc(30%-2px)]",
            linkClassName
          )}
        >
          {prevIcon && <span className="flex shrink-0 items-center">{prevIcon}</span>}
          <span data-component-part="pagination-label">Previous</span>
        </a>
      )}
      {next && (
        <a
          href={next.href}
          rel="next"
          data-component-part="pagination-next"
          className={cn(
            "group min-w-0 rounded-xl no-underline",
            // Next-only (e.g. docs index): full width on mobile, half the
            // container above 640px — pushed right like a forward button.
            // With prev: calc-based 70% (minus half the gap) so the pair
            // always fills the pill without overlapping.
            prev ? "w-[calc(70%-2px)]" : "w-full sm:ml-auto sm:w-1/2",
            linkClassName
          )}
        >
          <div className="bg-primary/15 hover:bg-primary/20 hover:ring-primary/30 flex h-16 flex-1 items-center justify-end rounded-xl transition-shadow hover:ring-1">
            <div className="flex min-w-0 flex-col items-end justify-center px-5">
              <div
                data-component-part="pagination-title"
                className="text-primary w-full truncate text-right text-sm font-semibold"
              >
                {next.title}
              </div>
              {next.description && (
                <span
                  data-component-part="pagination-description"
                  className="text-primary/75 hidden w-full max-w-72 truncate text-right text-xs sm:block"
                >
                  {next.description}
                </span>
              )}
            </div>
            <div className="bg-primary/20 h-8 w-px" />
            <div className="text-primary/75 flex items-center gap-1.5 pr-3 pl-5 text-sm">
              <span data-component-part="pagination-label">Next</span>
              {nextIcon && <span className="flex shrink-0 items-center">{nextIcon}</span>}
            </div>
          </div>
        </a>
      )}
    </nav>
  );
}
