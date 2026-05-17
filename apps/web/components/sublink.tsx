import { EachRoute } from "@/lib/routes";
import Anchor from "./anchor";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { SheetClose } from "@/components/ui/sheet";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";
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

  // Full path including parent's href
  const fullHref = parentHref ? `${parentHref}${href}` : `/docs${href}`;

  const shouldBeOpen = level === 0 || (!!items && path.startsWith(fullHref) && path !== fullHref);
  const [isOpen, setIsOpen] = useState(shouldBeOpen);

  // Check if any child is active (for parent items)
  const hasActiveChild = useMemo(() => {
    if (!items) return false;
    return items.some((item) => {
      const childHref = `${fullHref}${item.href}`;
      return path.startsWith(childHref) && path !== fullHref;
    });
  }, [items, path, fullHref]);

  // Sync open state when path changes (expand if child becomes active)
  if (shouldBeOpen && !isOpen) {
    setIsOpen(true);
  }

  // Only apply active styles if it's an exact match and not a parent with active children
  const Comp = useMemo(
    () => (
      <Anchor
        activeClassName={!hasActiveChild ? "dark:text-accent text-primary font-medium" : ""}
        href={fullHref}
        data-search-lvl0={level === 0 && hasActiveChild ? "true" : undefined}
        className={cn(
          "text-foreground/80 hover:text-foreground transition-colors",
          hasActiveChild && "text-foreground font-medium"
        )}
      >
        {title}
      </Anchor>
    ),
    [title, fullHref, hasActiveChild, level]
  );

  const titleOrLink = !noLink ? (
    isSheet ? (
      <SheetClose asChild>{Comp}</SheetClose>
    ) : (
      Comp
    )
  ) : (
    <h4
      data-search-lvl0={level === 0 && hasActiveChild ? "true" : undefined}
      className={cn(
        "text-foreground/90 hover:text-foreground font-medium transition-colors sm:text-sm",
        hasActiveChild ? "text-foreground" : "text-foreground/80"
      )}
    >
      {title}
    </h4>
  );

  if (!items) {
    return <div className="flex flex-col">{titleOrLink}</div>;
  }

  return (
    <div className={cn("flex w-full flex-col gap-1")}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex w-full items-center justify-between">
          {titleOrLink}
          <CollapsibleTrigger
            className="text-muted-foreground ml-2 cursor-pointer"
            aria-expanded={isOpen}
            aria-label={`Toggle ${title} section`}
            aria-controls={`collapsible-${fullHref.replace(/[^a-zA-Z0-9]/g, "-")}`}
          >
            {!isOpen ? (
              <ChevronRight className="h-[0.9rem] w-[0.9rem]" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-[0.9rem] w-[0.9rem]" aria-hidden="true" />
            )}
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent
          id={`collapsible-${fullHref.replace(/[^a-zA-Z0-9]/g, "-")}`}
          className={cn(
            "overflow-hidden transition-all duration-200 ease-in-out",
            isOpen ? "animate-collapsible-down" : "animate-collapsible-up"
          )}
        >
          <div
            className={cn(
              "text-foreground/80 hover:[&_a]:text-foreground mt-2.5 ml-0.5 flex flex-col items-start gap-3 transition-colors sm:text-sm",
              level > 0 && "border-border ml-1.5 border-l pl-4"
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
