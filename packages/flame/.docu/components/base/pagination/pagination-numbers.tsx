"use client";

import { cn } from "../../../node/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import {
  getPaginationRange,
  type PaginationRootProps,
  type PaginationItemProps,
  type PaginationButtonsProps,
  type PaginationRangeProps,
  type PaginationInfoProps,
  type PaginationFullProps,
} from "./types";

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

  return <div className={cn("join", sizeClass, variantClass, className)}>{children}</div>;
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
          {firstLabel ?? <ChevronLeft className="h-4 w-4" />}
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
          {prevLabel ?? <ChevronLeft className="h-4 w-4" />}
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
          {nextLabel ?? <ChevronRight className="h-4 w-4" />}
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
          {lastLabel ?? <ChevronRight className="h-4 w-4" />}
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
            <span key={`ellipsis-${index}`} className="join-item btn btn-disabled no-animation">
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
    <div className={cn("text-base-content/70 text-sm", className)}>
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
    <div className={cn("flex flex-col items-center justify-between gap-4 sm:flex-row", className)}>
      <PaginationInfo
        current={current}
        total={total}
        pageSize={pageSize}
        className={infoClassName}
      />

      <div className={cn("join", sizeClasses, variantClass)}>
        {showFirstLast && (
          <button
            type="button"
            className={cn("join-item btn", size !== "md" && `btn-${size}`)}
            onClick={() => onPageChange(1)}
            disabled={current <= 1}
            aria-label="First page"
          >
            <ChevronLeft className="h-4 w-4" />
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
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        {range.map((item, index) => {
          if (item === "ellipsis") {
            return (
              <span key={`ellipsis-${index}`} className="join-item btn btn-disabled no-animation">
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
            <ChevronRight className="h-4 w-4" />
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
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
