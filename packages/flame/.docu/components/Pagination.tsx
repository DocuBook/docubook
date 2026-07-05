"use client";

import type { ReactNode } from "react";
import { getPreviousNext } from "../node/route";
import { docsHtmlHref } from "../node/utils";
import { PaginationDocs } from "@docubook/ui-react/pagination";

interface PaginationProps {
  pathname: string;
  className?: string;
  prevIcon?: ReactNode;
  nextIcon?: ReactNode;
  linkClassName?: string;
}

export default function Pagination({
  pathname,
  className,
  prevIcon,
  nextIcon,
  linkClassName,
}: PaginationProps) {
  const { prev, next } = getPreviousNext(pathname);

  if (!prev && !next) {
    return null;
  }

  return (
    <PaginationDocs
      prev={prev ? { href: docsHtmlHref(`/docs${prev.href}`), title: prev.title } : undefined}
      next={next ? { href: docsHtmlHref(`/docs${next.href}`), title: next.title } : undefined}
      className={className}
      prevIcon={prevIcon}
      nextIcon={nextIcon}
      linkClassName={linkClassName}
    />
  );
}
