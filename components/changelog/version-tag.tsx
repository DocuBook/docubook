"use client";

import { cn } from "@/lib/utils";

export function VersionTag({ version }: { version: string }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium",
      "bg-primary/10 text-primary"
    )}>
      v{version}
    </span>
  );
}