"use client";

import { ROUTES } from "@/lib/routes-config";
import SubLink from "./sublink";
import { usePathname } from "next/navigation";

interface DocsMenuProps {
  isSheet?: boolean;
  className?: string;
}

export default function DocsMenu({ isSheet = false, className = "" }: DocsMenuProps) {
  const pathname = usePathname();

  // Skip rendering if not on a docs page
  if (!pathname.startsWith("/docs")) return null;

  return (
    <nav
      aria-label="Documentation navigation"
      className={className}
    >
      <ul className="flex flex-col gap-3.5 mt-5 pr-2 pb-6">
        {ROUTES.map((item, index) => {
          // Normalize href - hapus leading/trailing slashes
          const normalizedHref = `/${item.href.replace(/^\/+|\/+$/g, '')}`;
          const itemHref = `/docs${normalizedHref}`;

          const modifiedItems = {
            ...item,
            href: itemHref,
            level: 0,
            isSheet,
          };

          return (
            <li key={`${item.title}-${index}`}>
              <SubLink {...modifiedItems} />
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
