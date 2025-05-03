"use client";

import { useEffect, useState } from "react";
import { cn, formatDate2 } from "@/lib/utils";
import { History } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface VersionTocProps {
  versions: Array<{
    version: string;
    date: string;
  }>;
}

export function VersionToc({ versions }: VersionTocProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    // Handle initial hash
    const hash = window.location.hash.slice(1);
    if (hash) {
      setActiveId(hash);
    }

    // Set up intersection observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            setActiveId(id);
            // Use pushState instead of replaceState to maintain history
            window.history.pushState(null, '', `#${id}`);
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: '-20% 0px -60% 0px'
      }
    );

    // Observe version elements
    versions.forEach(({ version }) => {
      const element = document.getElementById(`v${version}`);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [versions]);

  return (
    <aside className="lg:flex hidden toc flex-[1.5] min-w-[238px] pt-8 sticky top-16 h-[calc(100vh-4rem)]">
      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center gap-2 mb-2">
          <History className="w-4 h-4" />
          <h3 className="font-medium text-sm">Version History</h3>
        </div>
        <ScrollArea className="h-full">
          <div className="flex flex-col gap-1.5 text-sm dark:text-stone-300/85 text-stone-800 pr-4">
            {versions.map(({ version, date }) => (
              <a
                key={version}
                href={`#v${version}`}
                className={cn(
                  "hover:text-foreground transition-colors py-1",
                  activeId === `v${version}` && "font-medium text-primary"
                )}
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById(`v${version}`);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                    setActiveId(`v${version}`);
                    window.history.pushState(null, '', `#v${version}`);
                  }
                }}
              >
                v{version}
                <span className="text-xs text-muted-foreground ml-2">
                  {formatDate2(date)}
                </span>
              </a>
            ))}
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
}
