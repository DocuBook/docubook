"use client";

import { useEffect, useState } from "react";
import { cn, formatDate2 } from "@/lib/utils";
import { History, PanelLeftOpen, PanelLeftClose } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface VersionTocProps {
  versions: Array<{
    version: string;
    date: string;
  }>;
}

export function VersionToc({ versions }: VersionTocProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      setActiveId(hash);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            setActiveId(id);
            window.history.pushState(null, "", `#${id}`);
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: "-20% 0px -60% 0px",
      }
    );

    versions.forEach(({ version }) => {
      const element = document.getElementById(`v${version}`);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [versions]);

  return (
    <aside
      className={cn(
        "sticky top-16 h-[calc(100vh-4rem)] border-r bg-background transition-all duration-300 z-20 hidden md:flex",
        collapsed ? "w-[48px]" : "w-[250px]"
      )}
    >
      {/* Toggle Button */}
      <div className="absolute top-0 right-0 py-2 px-0 ml-6 z-30">
        <Button
          size="icon"
          variant="outline"
          className="hover:bg-transparent hover:text-inherit border-none text-muted-foreground"
          onClick={() => setCollapsed((prev) => !prev)}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </Button>
      </div>

      {/* Content */}
      {!collapsed && (
        <div className="flex flex-col gap-2 w-full pt-8 pr-2">
          <div className="flex mb-2">
            <h2 className="font-semibold text-lg">Changelog</h2>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <History className="w-4 h-4" />
            <h3 className="font-medium text-sm">Version History</h3>
          </div>
          <ScrollArea className="h-full pr-2">
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
                      element.scrollIntoView({ behavior: "smooth" });
                      setActiveId(`v${version}`);
                      window.history.pushState(null, "", `#v${version}`);
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
      )}
    </aside>
  );
}
