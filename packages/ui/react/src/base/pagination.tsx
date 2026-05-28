"use client";

import { cn } from "../utils/cn";
import { useMemo, type ReactNode } from "react";

export type PaginationSize = "lg" | "md" | "sm" | "xs";
export type PaginationVariant = "default" | "square" | "rounded";

export interface PaginationItemProps {
  children: ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  size?: PaginationSize;
  "aria-label"?: string;
}
export interface PaginationFullProps {
  current: number;
  total: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  className?: string;
  size?: PaginationSize;
  variant?: PaginationVariant;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  infoClassName?: string;
}
export interface PaginationDocsProps {
  prev?: { href: string; title: string };
  next?: { href: string; title: string };
  className?: string;
  prevIcon?: ReactNode;
  nextIcon?: ReactNode;
  linkClassName?: string;
}
export interface PaginationButtonsProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  size?: PaginationSize;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  prevLabel?: string;
  nextLabel?: string;
  firstLabel?: string;
  lastLabel?: string;
  disabled?: boolean;
}
export interface PaginationRangeProps {
  start: number;
  end: number;
  total: number;
  current: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  className?: string;
  size?: PaginationSize;
  variant?: PaginationVariant;
}
export interface PaginationInfoProps {
  current: number;
  total: number;
  pageSize?: number;
  className?: string;
  label?: string;
  showTotal?: boolean;
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
  if (totalPages <= 1) return [1];
  const totalPageNumbers = siblingCount + 5;
  if (totalPages < totalPageNumbers) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);
  const showLeftDots = leftSiblingIndex > 2;
  const showRightDots = rightSiblingIndex < totalPages - 1;
  if (!showLeftDots && showRightDots)
    return [...Array.from({ length: 3 }, (_, i) => i + 1), "ellipsis", totalPages - 1, totalPages];
  if (showLeftDots && !showRightDots)
    return [1, 2, "ellipsis", ...Array.from({ length: 3 }, (_, i) => totalPages - 2 + i)];
  if (showLeftDots && showRightDots) {
    const middle = Array.from(
      { length: rightSiblingIndex - leftSiblingIndex + 1 },
      (_, i) => leftSiblingIndex + i
    );
    return [1, 2, "ellipsis", ...middle, "ellipsis", totalPages - 1, totalPages];
  }
  return [1];
}

function variantClass(variant?: PaginationVariant) {
  if (variant === "square") return "[&_.join-item]:btn-square";
  if (variant === "rounded") return "[&_.join-item]:btn-circle";
  return "";
}

export function PaginationItem({
  children,
  active,
  disabled,
  onClick,
  className,
  size = "md",
  "aria-label": ariaLabel,
}: PaginationItemProps) {
  const sizeClass =
    size === "lg" ? "btn-lg" : size === "sm" ? "btn-sm" : size === "xs" ? "btn-xs" : "";
  return (
    <button
      type="button"
      className={cn(
        "join-item btn",
        sizeClass,
        active && "btn-active",
        disabled && "btn-disabled",
        className
      )}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </button>
  );
}

export function PaginationButtons({
  page,
  totalPages,
  onPageChange,
  className,
  size = "md",
  showFirstLast = false,
  showPrevNext = true,
  prevLabel,
  nextLabel,
  firstLabel,
  lastLabel,
  disabled = false,
}: PaginationButtonsProps) {
  const sizeClass = size !== "md" ? `btn-${size}` : "";
  return (
    <>
      {showFirstLast && (
        <button
          type="button"
          className={cn("join-item btn", sizeClass, className)}
          onClick={() => onPageChange(1)}
          disabled={disabled || page <= 1}
          aria-label={firstLabel ?? "First page"}
        >
          {firstLabel ?? "«"}
        </button>
      )}
      {showPrevNext && (
        <button
          type="button"
          className={cn("join-item btn", sizeClass, className)}
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || page <= 1}
          aria-label={prevLabel ?? "Previous page"}
        >
          {prevLabel ?? "‹"}
        </button>
      )}
      <span className="join-item btn btn-disabled no-animation cursor-default">
        {page} / {totalPages}
      </span>
      {showPrevNext && (
        <button
          type="button"
          className={cn("join-item btn", sizeClass, className)}
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || page >= totalPages}
          aria-label={nextLabel ?? "Next page"}
        >
          {nextLabel ?? "›"}
        </button>
      )}
      {showFirstLast && (
        <button
          type="button"
          className={cn("join-item btn", sizeClass, className)}
          onClick={() => onPageChange(totalPages)}
          disabled={disabled || page >= totalPages}
          aria-label={lastLabel ?? "Last page"}
        >
          {lastLabel ?? "»"}
        </button>
      )}
    </>
  );
}

export function PaginationRange({
  start,
  end,
  total,
  current,
  onPageChange,
  siblingCount = 1,
  className,
  size = "md",
  variant,
}: PaginationRangeProps) {
  const range = useMemo(
    () =>
      getPaginationRange({
        totalCount: total,
        pageSize: end - start + 1,
        siblingCount,
        currentPage: current,
      }),
    [total, start, end, siblingCount, current]
  );
  const sizeClass =
    size === "lg" ? "join-lg" : size === "sm" ? "join-sm" : size === "xs" ? "join-xs" : "";
  return (
    <div className={cn("join", sizeClass, variantClass(variant), className)}>
      {range.map((item, i) =>
        item === "ellipsis" ? (
          <span key={`e-${i}`} className="join-item btn btn-disabled no-animation">
            ...
          </span>
        ) : (
          <button
            key={item}
            type="button"
            className={cn(
              "join-item btn",
              item === current && "btn-active",
              size !== "md" && `btn-${size}`
            )}
            onClick={() => onPageChange(item)}
            aria-current={item === current ? "page" : undefined}
          >
            {item}
          </button>
        )
      )}
    </div>
  );
}

export function PaginationInfo({
  current,
  total,
  pageSize = 10,
  className,
  label = "Showing",
  showTotal = true,
}: PaginationInfoProps) {
  const start = (current - 1) * pageSize + 1;
  const end = Math.min(current * pageSize, total);
  return (
    <div className={cn("text-base-content/70 text-sm", className)}>
      {label} {start}-{end}
      {showTotal && ` of ${total}`}
    </div>
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
  variant,
  showFirstLast = true,
  showPrevNext = true,
  infoClassName,
}: PaginationFullProps) {
  const totalPages = Math.ceil(total / pageSize);
  const range = useMemo(
    () => getPaginationRange({ totalCount: total, pageSize, siblingCount, currentPage: current }),
    [total, pageSize, siblingCount, current]
  );
  const sizeClass =
    size === "lg" ? "join-lg" : size === "sm" ? "join-sm" : size === "xs" ? "join-xs" : "";
  return (
    <div className={cn("flex flex-col items-center justify-between gap-4 sm:flex-row", className)}>
      <PaginationInfo
        current={current}
        total={total}
        pageSize={pageSize}
        className={infoClassName}
      />
      <div className={cn("join", sizeClass, variantClass(variant))}>
        {showFirstLast && (
          <button
            type="button"
            className={cn("join-item btn", size !== "md" && `btn-${size}`)}
            onClick={() => onPageChange(1)}
            disabled={current <= 1}
            aria-label="First page"
          >
            «
          </button>
        )}
        {showPrevNext && (
          <button
            type="button"
            className={cn("join-item btn", size !== "md" && `btn-${size}`)}
            onClick={() => onPageChange(current - 1)}
            disabled={current <= 1}
            aria-label="Previous page"
          >
            ‹
          </button>
        )}
        {range.map((item, i) =>
          item === "ellipsis" ? (
            <span key={`e-${i}`} className="join-item btn btn-disabled no-animation">
              ...
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={cn(
                "join-item btn",
                item === current && "btn-active",
                size !== "md" && `btn-${size}`
              )}
              onClick={() => onPageChange(item)}
              aria-current={item === current ? "page" : undefined}
            >
              {item}
            </button>
          )
        )}
        {showPrevNext && (
          <button
            type="button"
            className={cn("join-item btn", size !== "md" && `btn-${size}`)}
            onClick={() => onPageChange(current + 1)}
            disabled={current >= totalPages}
            aria-label="Next page"
          >
            ›
          </button>
        )}
        {showFirstLast && (
          <button
            type="button"
            className={cn("join-item btn", size !== "md" && `btn-${size}`)}
            onClick={() => onPageChange(totalPages)}
            disabled={current >= totalPages}
            aria-label="Last page"
          >
            »
          </button>
        )}
      </div>
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
