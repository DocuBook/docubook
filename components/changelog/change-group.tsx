"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type ChangeType = "Added" | "Improved" | "Fixed" | "Deprecated" | "Removed";

interface ChangeGroupProps {
  type: ChangeType;
  changes: string[];
  expanded: boolean;
}

const typeColors: Record<ChangeType, string> = {
  Added: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Improved: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Fixed: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Deprecated: "bg-red-500/10 text-red-600 dark:text-red-400",
  Removed: "bg-slate-500/10 text-slate-600 dark:text-slate-400"
};

export function ChangeGroup({ type, changes, expanded }: ChangeGroupProps) {
  const visibleChanges = expanded ? changes : changes.slice(0, 5);
  const hasMore = changes.length > 5;

  return (
    <div className="space-y-3">
      <Badge variant="outline" className={cn("font-medium", typeColors[type])}>
        {type}
      </Badge>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-2">
        {visibleChanges.map((change, i) => (
          <li key={i} id="changelog" className="text-sm leading-relaxed marker:text-muted-foreground/60">
            {change}
          </li>
        ))}
        {!expanded && hasMore && (
          <li id="changelog-more" className="text-sm text-muted-foreground/60">
            +{changes.length - 5} more improvements
          </li>
        )}
      </ul>
    </div>
  );
}