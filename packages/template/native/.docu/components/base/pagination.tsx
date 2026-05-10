"use client";

import { cn } from "../../lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, type ReactNode } from "react";

type PaginationSize = "lg" | "md" | "sm" | "xs";
type PaginationVariant = "default" | "square" | "rounded";

interface PaginationRootProps {
  children?: ReactNode;
  className?: string;
  size?: PaginationSize;
  variant?: PaginationVariant;
}

interface PaginationItemProps {
  children: ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  size?: PaginationSize;
  variant?: PaginationVariant;
  "aria-label"?: string;
}

interface PaginationRangeProps {
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

interface PaginationButtonsProps {
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

interface PaginationInfoProps {
  current: number;
  total: number;
  pageSize?: number;
  className?: string;
  label?: string;
  showTotal?: boolean;
}

interface PaginationFullProps {
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

interface PaginationDocsProps {
  prev?: { href: string; title: string };
  next?: { href: string; title: string };
  className?: string;
}

function getPaginationRange({
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
  const DOTS = "ellipsis" as const;

  if (totalPages === 1) {
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
    const leftRange = Array.from({ length: 3 }, (_, i) => i + 1);
    return [...leftRange, DOTS, totalPages - 1, totalPages];
  }

  if (showLeftDots && !showRightDots) {
    const rightRange = Array.from({ length: 3 }, (_, i) => totalPages - 2 + i);
    return [1, 2, DOTS, ...rightRange];
  }

  if (showLeftDots && showRightDots) {
    const middleRange = Array.from(
      { length: rightSiblingIndex - leftSiblingIndex + 1 },
      (_, i) => leftSiblingIndex + i
    );
    return [1, 2, DOTS, ...middleRange, DOTS, totalPages - 1, totalPages];
  }

  return [1];
}

export function Pagination({
  children,
  className,
  size = "md",
  variant = "default",
}: PaginationRootProps) {
  const sizeClass = {
    lg: "join-lg",
    md: "",
    sm: "join-sm",
    xs: "join-xs",
  }[size];

  const variantClass =
    variant === "square"
      ? "[&_.join-item]:btn-square"
      : variant === "rounded"
        ? "[&_.join-item]:btn-circle"
        : "";

  return (
    <div className={cn("join", sizeClass, variantClass, className)}>
      {children}
    </div>
  );
}

export function PaginationItem({
  children,
  active = false,
  disabled = false,
  onClick,
  className,
  size = "md",
  "aria-label": ariaLabel,
}: PaginationItemProps) {
  const sizeClasses = {
    lg: "btn-lg",
    md: "",
    sm: "btn-sm",
    xs: "btn-xs",
  }[size];

  return (
    <button
      type="button"
      className={cn(
        "join-item btn",
        sizeClasses,
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
  const handlePrev = () => {
    if (page > 1) onPageChange(page - 1);
  };

  const handleNext = () => {
    if (page < totalPages) onPageChange(page + 1);
  };

  const handleFirst = () => {
    onPageChange(1);
  };

  const handleLast = () => {
    onPageChange(totalPages);
  };

  return (
    <>
      {showFirstLast && (
        <button
          type="button"
          className={cn("join-item btn", size !== "md" && `btn-${size}`, className)}
          onClick={handleFirst}
          disabled={disabled || page <= 1}
          aria-label={firstLabel ?? "First page"}
        >
          {firstLabel ?? <ChevronLeft className="w-4 h-4" />}
        </button>
      )}

      {showPrevNext && (
        <button
          type="button"
          className={cn("join-item btn", size !== "md" && `btn-${size}`, className)}
          onClick={handlePrev}
          disabled={disabled || page <= 1}
          aria-label={prevLabel ?? "Previous page"}
        >
          {prevLabel ?? <ChevronLeft className="w-4 h-4" />}
        </button>
      )}

      <span className="join-item btn btn-disabled no-animation cursor-default">
        {page} / {totalPages}
      </span>

      {showPrevNext && (
        <button
          type="button"
          className={cn("join-item btn", size !== "md" && `btn-${size}`, className)}
          onClick={handleNext}
          disabled={disabled || page >= totalPages}
          aria-label={nextLabel ?? "Next page"}
        >
          {nextLabel ?? <ChevronRight className="w-4 h-4" />}
        </button>
      )}

      {showFirstLast && (
        <button
          type="button"
          className={cn("join-item btn", size !== "md" && `btn-${size}`, className)}
          onClick={handleLast}
          disabled={disabled || page >= totalPages}
          aria-label={lastLabel ?? "Last page"}
        >
          {lastLabel ?? <ChevronRight className="w-4 h-4" />}
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
  variant = "default",
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

  const sizeClasses = {
    lg: "join-lg",
    md: "",
    sm: "join-sm",
    xs: "join-xs",
  }[size];

  const variantClass =
    variant === "square"
      ? "[&_.join-item]:btn-square"
      : variant === "rounded"
        ? "[&_.join-item]:btn-circle"
        : "";

  return (
    <div className={cn("join", sizeClasses, variantClass, className)}>
      {range.map((item, index) => {
        if (item === "ellipsis") {
          return (
            <span
              key={`ellipsis-${index}`}
              className="join-item btn btn-disabled no-animation"
            >
              ...
            </span>
          );
        }

        const isActive = item === current;

        return (
          <button
            key={item}
            type="button"
            className={cn(
              "join-item btn",
              isActive && "btn-active",
              size !== "md" && `btn-${size}`
            )}
            onClick={() => onPageChange(item)}
            aria-label={`Page ${item}`}
            aria-current={isActive ? "page" : undefined}
          >
            {item}
          </button>
        );
      })}
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
    <div className={cn("text-sm text-base-content/70", className)}>
      {label} {start}-{end} {showTotal && `of ${total}`}
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
  variant = "default",
  showFirstLast = true,
  showPrevNext = true,
  infoClassName,
}: PaginationFullProps) {
  const totalPages = Math.ceil(total / pageSize);

  const range = useMemo(
    () =>
      getPaginationRange({
        totalCount: total,
        pageSize,
        siblingCount,
        currentPage: current,
      }),
    [total, pageSize, siblingCount, current]
  );

  const sizeClasses = {
    lg: "join-lg",
    md: "",
    sm: "join-sm",
    xs: "join-xs",
  }[size];

  const variantClass =
    variant === "square"
      ? "[&_.join-item]:btn-square"
      : variant === "rounded"
        ? "[&_.join-item]:btn-circle"
        : "";

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4", className)}>
      <PaginationInfo current={current} total={total} pageSize={pageSize} className={infoClassName} />

      <div className={cn("join", sizeClasses, variantClass)}>
        {showFirstLast && (
          <button
            type="button"
            className={cn("join-item btn", size !== "md" && `btn-${size}`)}
            onClick={() => onPageChange(1)}
            disabled={current <= 1}
            aria-label="First page"
          >
            <ChevronLeft className="w-4 h-4" />
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
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {range.map((item, index) => {
          if (item === "ellipsis") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="join-item btn btn-disabled no-animation"
              >
                ...
              </span>
            );
          }

          const isActive = item === current;

          return (
            <button
              key={item}
              type="button"
              className={cn(
                "join-item btn",
                isActive && "btn-active",
                size !== "md" && `btn-${size}`
              )}
              onClick={() => onPageChange(item)}
              aria-label={`Page ${item}`}
              aria-current={isActive ? "page" : undefined}
            >
              {item}
            </button>
          );
        })}

        {showPrevNext && (
          <button
            type="button"
            className={cn("join-item btn", size !== "md" && `btn-${size}`)}
            onClick={() => onPageChange(current + 1)}
            disabled={current >= totalPages}
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
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
            <ChevronRight className="w-4 h-4" />
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
}: PaginationDocsProps) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 grow py-8 gap-4", className)}>
      <div>
        {prev && (
          <a
            href={prev.href}
            className="btn btn-outline w-full flex-col pl-4 py-6! items-start! no-underline h-auto"
          >
            <span className="flex items-center text-xs text-base-content/60">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </span>
            <span className="mt-1 text-sm font-medium text-base-content">{prev.title}</span>
          </a>
        )}
      </div>

      <div>
        {next && (
          <a
            href={next.href}
            className="btn btn-outline w-full flex-col pr-4 py-6! items-end! no-underline h-auto"
          >
            <span className="flex items-center text-xs text-base-content/60">
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </span>
            <span className="mt-1 text-sm font-medium text-base-content">{next.title}</span>
          </a>
        )}
      </div>
    </div>
  );
}

export type {
  PaginationRootProps as PaginationProps,
  PaginationItemProps,
  PaginationRangeProps,
  PaginationButtonsProps,
  PaginationInfoProps,
  PaginationFullProps,
  PaginationDocsProps,
  PaginationSize,
  PaginationVariant,
};

export { getPaginationRange };
