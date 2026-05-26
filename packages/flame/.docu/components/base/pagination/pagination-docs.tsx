import { cn } from "../../../node/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginationDocsProps } from "./types";

export function PaginationDocs({ prev, next, className }: PaginationDocsProps) {
  return (
    <div className={cn("grid grow grid-cols-1 gap-4 py-8 sm:grid-cols-2", className)}>
      <div>
        {prev && (
          <a
            href={prev.href}
            className="btn btn-outline border-base-300 items-start! py-2! h-auto w-full flex-col pl-4 no-underline"
          >
            <span className="text-muted-foreground flex items-center text-xs">
              <ChevronLeft className="mr-1 h-4 w-4" />
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
            className="btn btn-outline border-base-300 items-end! py-2! h-auto w-full flex-col pr-4 no-underline"
          >
            <span className="text-muted-foreground flex items-center text-xs">
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </span>
            <span className="text-base-content mt-1 text-sm font-medium">{next.title}</span>
          </a>
        )}
      </div>
    </div>
  );
}
