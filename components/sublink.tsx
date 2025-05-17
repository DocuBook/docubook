import { EachRoute } from "@/lib/routes-config";
import Anchor from "./anchor";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { SheetClose } from "@/components/ui/sheet";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { usePathname } from "next/navigation";

interface SubLinkProps extends EachRoute {
  level: number;
  isSheet: boolean;
  parentHref?: string;
}

export default function SubLink({
  title,
  href,
  items,
  noLink,
  level,
  isSheet,
  parentHref = "",
}: SubLinkProps) {
  const path = usePathname();
  const [isOpen, setIsOpen] = useState(level === 0);

  // Full path including parent's href
  const fullHref = `${parentHref}${href}`;

  // Check if current path exactly matches this link's href
  const isExactActive = useMemo(() => path === fullHref, [path, fullHref]);

  // Check if any child is active (for parent items)
  const hasActiveChild = useMemo(() => {
    if (!items) return false;
    return items.some(item => {
      const childHref = `${fullHref}${item.href}`;
      return path.startsWith(childHref) && path !== fullHref;
    });
  }, [items, path, fullHref]);

  // Auto-expand if current path is a child of this item
  useEffect(() => {
    if (items && (path.startsWith(fullHref) && path !== fullHref)) {
      setIsOpen(true);
    }
  }, [path, fullHref, items]);

  // Only apply active styles if it's an exact match and not a parent with active children
  const Comp = useMemo(() => (
    <Anchor
      activeClassName={!hasActiveChild ? "text-primary font-medium" : ""}
      href={fullHref}
      className={cn(
        hasActiveChild && "font-medium text-foreground"
      )}
    >
      {title}
    </Anchor>
  ), [title, fullHref, hasActiveChild]);

  const titleOrLink = !noLink ? (
    isSheet ? (
      <SheetClose asChild>{Comp}</SheetClose>
    ) : (
      Comp
    )
  ) : (
    <h4 className={cn(
      "font-medium sm:text-sm",
      hasActiveChild ? "text-foreground" : "text-primary"
    )}>
      {title}
    </h4>
  );

  if (!items) {
    return <div className="flex flex-col">{titleOrLink}</div>;
  }

  return (
    <div className={cn("flex flex-col gap-1 w-full")}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger
          className="w-full pr-5 text-left"
          aria-expanded={isOpen}
          aria-controls={`collapsible-${fullHref.replace(/[^a-zA-Z0-9]/g, '-')}`}
        >
          <div className="flex items-center justify-between w-full">
            {titleOrLink}
            <span className="ml-2">
              {!isOpen ? (
                <ChevronRight className="h-[0.9rem] w-[0.9rem]" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-[0.9rem] w-[0.9rem]" aria-hidden="true" />
              )}
            </span>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent
          id={`collapsible-${fullHref.replace(/[^a-zA-Z0-9]/g, '-')}`}
          className={cn(
            "overflow-hidden transition-all duration-200 ease-in-out",
            isOpen ? "animate-collapsible-down" : "animate-collapsible-up"
          )}
        >
          <div
            className={cn(
              "flex flex-col items-start sm:text-sm dark:text-stone-300/85 text-stone-800 ml-0.5 mt-2.5 gap-3",
              level > 0 && "pl-4 border-l ml-1.5"
            )}
          >
            {items?.map((innerLink) => (
              <SubLink
                key={`${fullHref}${innerLink.href}`}
                {...innerLink}
                href={innerLink.href}
                level={level + 1}
                isSheet={isSheet}
                parentHref={fullHref}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
