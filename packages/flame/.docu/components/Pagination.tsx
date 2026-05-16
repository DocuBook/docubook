"use client";

import { getPreviousNext } from "../lib/route";
import { PaginationDocs } from "./base/pagination";

interface PaginationProps {
  pathname: string;
  className?: string;
}

export default function Pagination({ pathname, className }: PaginationProps) {
  const { prev, next } = getPreviousNext(pathname);

  if (!prev && !next) {
    return null;
  }

  return (
    <PaginationDocs
      prev={prev ? { href: `/docs${prev.href}`, title: prev.title } : undefined}
      next={next ? { href: `/docs${next.href}`, title: next.title } : undefined}
      className={className}
    />
  );
}
