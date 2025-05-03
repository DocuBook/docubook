"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ComponentProps, forwardRef } from "react";

type AnchorProps = ComponentProps<typeof Link> & {
  absolute?: boolean;
  activeClassName?: string;
  disabled?: boolean;
};

const Anchor = forwardRef<HTMLAnchorElement, AnchorProps>(
  ({ absolute, className = "", activeClassName = "", disabled, children, ...props }, ref) => {
    const path = usePathname();
    const href = props.href.toString();

    // Deteksi URL eksternal menggunakan regex
    const isExternal = /^(https?:\/\/|\/\/)/.test(href);

    let isMatch = absolute
      ? href.split("/")[1] === path.split("/")[1]
      : path === href;

    if (isExternal) isMatch = false; // Hindari mencocokkan URL eksternal

    if (disabled)
      return (
        <div className={cn(className, "cursor-not-allowed")}>{children}</div>
      );

    return (
      <Link ref={ref} className={cn(className, isMatch && activeClassName)} {...props}>
        {children}
      </Link>
    );
  }
);

Anchor.displayName = "Anchor";

export default Anchor;
