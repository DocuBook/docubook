"use client";

import { cn } from "../cn";
import type { ReactNode } from "react";

export type PaginationSize = "lg" | "md" | "sm" | "xs";

export interface PaginationProps {
  children?: ReactNode;
  className?: string;
  size?: PaginationSize;
}

export interface PaginationItemProps {
  children: ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  size?: PaginationSize;
}

export interface PaginationFullProps {
  current: number;
  total: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  className?: string;
  size?: PaginationSize;
}

export interface PaginationDocsProps {
  prev?: { href: string; title: string };
  next?: { href: string; title: string };
  className?: string;
}

export function getPaginationRange({
  totalCount,
  pageSize,
  siblingCount = 1,
  currentPage,
}: {
  totalCount: number;
  pageSize: number;
  siblingCount?: number;
  currentPage: number;
}): (number | "ellipsis")[] {
  const totalPages = Math.ceil(totalCount / pageSize);

  if (totalPages <= 1) {
    return [1];
  }

  const totalPageNumbers = siblingCount + 5;
  if (totalPages < totalPageNumbers) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);
  const showLeftDots = leftSiblingIndex > 2;
  const showRightDots = rightSiblingIndex < totalPages - 1;

  if (!showLeftDots && showRightDots) {
    return [...Array.from({ length: 3 }, (_, i) => i + 1), "ellipsis", totalPages - 1, totalPages];
  }
  if (showLeftDots && !showRightDots) {
    return [1, 2, "ellipsis", ...Array.from({ length: 3 }, (_, i) => totalPages - 2 + i)];
  }
  if (showLeftDots && showRightDots) {
    const middle = Array.from(
      { length: rightSiblingIndex - leftSiblingIndex + 1 },
      (_, i) => leftSiblingIndex + i
    );
    return [1, 2, "ellipsis", ...middle, "ellipsis", totalPages - 1, totalPages];
  }
  return [1];
}

export function Pagination({ children, className, size = "md" }: PaginationProps) {
  return (
    <div className={cn("join", size === "sm" && "join-sm", size === "xs" && "join-xs", className)}>
      {children}
    </div>
  );
}

export function PaginationItem({
  children,
  active,
  disabled,
  onClick,
  className,
  size = "md",
}: PaginationItemProps) {
  return (
    <button
      type="button"
      className={cn(
        "join-item btn",
        size === "sm" && "btn-sm",
        size === "xs" && "btn-xs",
        size === "lg" && "btn-lg",
        active && "btn-active",
        disabled && "btn-disabled",
        className
      )}
      onClick={onClick}
      disabled={disabled}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </button>
  );
}

export function PaginationFull({
  current,
  total,
  pageSize = 10,
  onPageChange,
  siblingCount = 1,
  className,
  size = "md",
}: PaginationFullProps) {
  const totalPages = Math.ceil(total / pageSize);
  const range = getPaginationRange({
    totalCount: total,
    pageSize,
    siblingCount,
    currentPage: current,
  });

  return (
    <Pagination className={className} size={size}>
      <PaginationItem disabled={current <= 1} onClick={() => onPageChange(current - 1)} size={size}>
        «
      </PaginationItem>
      {range.map((item, i) =>
        item === "ellipsis" ? (
          <PaginationItem key={`dots-${i}`} disabled size={size}>
            …
          </PaginationItem>
        ) : (
          <PaginationItem
            key={item}
            active={item === current}
            onClick={() => onPageChange(item)}
            size={size}
          >
            {item}
          </PaginationItem>
        )
      )}
      <PaginationItem
        disabled={current >= totalPages}
        onClick={() => onPageChange(current + 1)}
        size={size}
      >
        »
      </PaginationItem>
    </Pagination>
  );
}

export function PaginationDocs({ prev, next, className }: PaginationDocsProps) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 py-8 sm:grid-cols-2", className)}>
      <div>
        {prev && (
          <a
            href={prev.href}
            className="btn btn-outline border-base-300 h-auto w-full flex-col items-start py-2 no-underline"
          >
            <span className="text-base-content/60 text-xs">← Previous</span>
            <span className="text-base-content text-sm font-medium">{prev.title}</span>
          </a>
        )}
      </div>
      <div>
        {next && (
          <a
            href={next.href}
            className="btn btn-outline border-base-300 h-auto w-full flex-col items-end py-2 no-underline"
          >
            <span className="text-base-content/60 text-xs">Next →</span>
            <span className="text-base-content text-sm font-medium">{next.title}</span>
          </a>
        )}
      </div>
    </div>
  );
}
