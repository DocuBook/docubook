import { cn } from "../utils/cn";
import type { ReactNode } from "react";

export interface PaginationDocsProps {
  prev?: { href: string; title: string; description?: string };
  next?: { href: string; title: string; description?: string };
  className?: string;
  prevIcon?: ReactNode;
  nextIcon?: ReactNode;
  linkClassName?: string;
}

interface PaginationCardProps {
  direction: "prev" | "next";
  label: string;
  title: string;
  description?: string;
  icon?: ReactNode;
}

function PaginationCard({ direction, label, title, description, icon }: PaginationCardProps) {
  const isPrevious = direction === "prev";

  const labelNode = (
    <div
      className={cn(
        "text-primary/75 flex items-center gap-1.5 text-sm",
        isPrevious ? "pr-5 pl-3" : "pr-3 pl-5"
      )}
    >
      {isPrevious && icon && <span className="flex shrink-0 items-center">{icon}</span>}
      <span data-component-part="pagination-label">{label}</span>
      {!isPrevious && icon && <span className="flex shrink-0 items-center">{icon}</span>}
    </div>
  );

  const metaNode = (
    <div
      className={cn(
        "flex min-w-0 flex-col justify-center px-5",
        isPrevious ? "items-start text-left" : "items-end text-right"
      )}
    >
      <div
        data-component-part="pagination-title"
        className="text-primary w-full truncate text-sm font-semibold"
      >
        {title}
      </div>
      {description && (
        <span
          data-component-part="pagination-description"
          className="text-primary/75 hidden w-full max-w-72 truncate text-xs sm:block"
        >
          {description}
        </span>
      )}
    </div>
  );

  return (
    <div
      className={cn(
        "bg-primary/15 hover:bg-primary/20 hover:ring-primary/30 flex h-16 flex-1 items-center rounded-xl transition-shadow hover:ring-1",
        isPrevious ? "justify-start" : "justify-end"
      )}
    >
      {isPrevious ? (
        <>
          {labelNode}
          <div className="bg-primary/20 h-8 w-px" />
          {metaNode}
        </>
      ) : (
        <>
          {metaNode}
          <div className="bg-primary/20 h-8 w-px" />
          {labelNode}
        </>
      )}
    </div>
  );
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
            "group min-w-0 rounded-xl no-underline",
            next
              ? // Paired with next: minimal link by design (30% of the pill).
                "text-muted-foreground hover:bg-base-200/60 hover:text-base-content flex w-[calc(30%-2px)] items-center justify-start gap-1.5 rounded-xl px-3 py-3 text-sm transition-colors"
              : // Alone (last page, no next): rich card mirroring the next-only
                // variant — full width on mobile, half the container above
                // 640px, pushed left like a back button.
                "w-full sm:mr-auto sm:w-1/2",
            linkClassName
          )}
        >
          {next ? (
            <>
              {prevIcon && <span className="flex shrink-0 items-center">{prevIcon}</span>}
              <span data-component-part="pagination-label">Previous</span>
            </>
          ) : (
            <PaginationCard
              direction="prev"
              label="Previous"
              title={prev.title}
              description={prev.description}
              icon={prevIcon}
            />
          )}
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
          <PaginationCard
            direction="next"
            label="Next"
            title={next.title}
            description={next.description}
            icon={nextIcon}
          />
        </a>
      )}
    </nav>
  );
}
