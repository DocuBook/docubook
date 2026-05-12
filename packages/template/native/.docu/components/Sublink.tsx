"use client";

import { useState, useEffect, useMemo } from "react";
import Collapse from "./base/collapse";
import Anchor from "./Anchor";
import type { DocuRoute } from "../lib/types";
import { cn } from "../lib/utils";

interface SublinkProps extends DocuRoute {
  level: number;
  isSheet?: boolean;
  parentHref?: string;
}

export default function Sublink({
  title,
  href,
  items,
  noLink,
  level,
  isSheet = false,
  parentHref = "",
}: SublinkProps) {
  const [isOpen, setIsOpen] = useState(level === 0);
  const fullHref = parentHref ? `${parentHref}${href}` : `/docs${href}`;

  useEffect(() => {
    if (items && typeof window !== "undefined") {
      const pathname = window.location.pathname;
      if (pathname.startsWith(fullHref) && pathname !== fullHref) {
        setIsOpen(true);
      }
    }
  }, [fullHref, items]);

  const hasActiveChild = useMemo(() => {
    if (!items || typeof window === "undefined") return false;
    const pathname = window.location.pathname;
    return items.some((item) => {
      const childHref = `${fullHref}${item.href}`;
      return pathname.startsWith(childHref) && pathname !== fullHref;
    });
  }, [items, fullHref]);

  if (noLink) {
    const titleEl = (
      <h4
        className={cn(
          "text-base-content/90 hover:text-base-content font-medium transition-colors sm:text-sm",
          hasActiveChild ? "text-base-content" : "text-base-content/80"
        )}
      >
        {title}
      </h4>
    );

    if (!items) {
      return <div className="flex flex-col">{titleEl}</div>;
    }

    return (
      <div className="flex w-full flex-col gap-1">
        <Collapse
          title={titleEl}
          defaultOpen={isOpen}
          onOpenChange={setIsOpen}
          className="border-0 bg-transparent shadow-none"
          titleClassName="p-0 bg-transparent hover:bg-transparent"
          contentClassName="pl-2"
        >
          <div
            className={cn(
              "text-base-content/80 hover:[&_a]:text-base-content mt-2.5 flex flex-col items-start gap-3 transition-colors sm:text-sm",
              level > 0 && "border-base-300 ml-1.5 border-l pl-4"
            )}
          >
            {items?.map((innerLink) => (
              <Sublink
                key={`${fullHref}${innerLink.href}`}
                {...innerLink}
                href={innerLink.href}
                level={level + 1}
                isSheet={isSheet}
                parentHref={fullHref}
              />
            ))}
          </div>
        </Collapse>
      </div>
    );
  }

  const linkEl = (
    <Anchor
      href={fullHref}
      className={cn(
        "text-base-content/80 hover:text-base-content transition-colors",
        hasActiveChild && "text-base-content font-medium"
      )}
      activeClassName={!hasActiveChild ? "font-medium text-primary" : ""}
    >
      {title}
    </Anchor>
  );

  if (!items) {
    return (
      <div className="flex flex-col">
        {isSheet ? (
          <label
            htmlFor="drawer"
            className="cursor-pointer"
            onClick={() => {
              const checkbox = document.getElementById("drawer") as HTMLInputElement;
              if (checkbox) checkbox.checked = false;
            }}
          >
            {linkEl}
          </label>
        ) : (
          linkEl
        )}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-1">
      <Collapse
        title={
          <div className="flex w-full items-center justify-between">
            {isSheet ? (
              <label
                htmlFor="drawer"
                className="flex-1 cursor-pointer"
                onClick={() => {
                  const checkbox = document.getElementById("drawer") as HTMLInputElement;
                  if (checkbox) checkbox.checked = false;
                }}
              >
                {linkEl}
              </label>
            ) : (
              <span className="flex-1">{linkEl}</span>
            )}
          </div>
        }
        defaultOpen={isOpen}
        onOpenChange={setIsOpen}
        className="border-0 bg-transparent shadow-none"
        titleClassName="p-0 bg-transparent hover:bg-transparent cursor-pointer"
        contentClassName="pl-2"
      >
        <div
          className={cn(
            "text-base-content/80 hover:[&_a]:text-base-content ml-0.5 mt-2.5 flex flex-col items-start gap-3 transition-colors sm:text-sm",
            level > 0 && "border-base-300 ml-1.5 border-l pl-4"
          )}
        >
          {items?.map((innerLink) => (
            <Sublink
              key={`${fullHref}${innerLink.href}`}
              {...innerLink}
              href={innerLink.href}
              level={level + 1}
              isSheet={isSheet}
              parentHref={fullHref}
            />
          ))}
        </div>
      </Collapse>
    </div>
  );
}
