import type { ReactNode } from "react";

export type PaginationSize = "lg" | "md" | "sm" | "xs";
export type PaginationVariant = "default" | "square" | "rounded";

export interface PaginationRootProps {
  children?: ReactNode;
  className?: string;
  size?: PaginationSize;
  variant?: PaginationVariant;
}

export interface PaginationItemProps {
  children: ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  size?: PaginationSize;
  variant?: PaginationVariant;
  "aria-label"?: string;
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

export interface PaginationInfoProps {
  current: number;
  total: number;
  pageSize?: number;
  className?: string;
  label?: string;
  showTotal?: boolean;
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
