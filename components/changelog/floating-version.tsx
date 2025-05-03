"use client";

import { useState, useEffect } from "react";
import { History } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface FloatingVersionTocProps {
  versions: { version: string; date: string }[];
}

export function FloatingVersionToc({ versions }: FloatingVersionTocProps) {
  const [open, setOpen] = useState(false);
  const [activeVersion, setActiveVersion] = useState(versions[0]?.version || "");

  useEffect(() => {
    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveVersion(entry.target.id.replace("version-", ""));
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: "-64px 0px -50% 0px",
      threshold: 0.25,
    });

    versions.forEach(({ version }) => {
      const section = document.getElementById(`version-${version}`);
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, [versions]);

  const handleScrollToVersion = (version: string) => {
    const element = document.getElementById(`version-${version}`);
    if (element) {
      setTimeout(() => {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      setActiveVersion(version);
      setOpen(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 lg:hidden z-50">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="rounded-full shadow-lg px-4 py-2 flex items-center gap-2">
            <History className="w-5 h-5" />
                Version - {activeVersion}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2 bg-background shadow-md rounded-lg">
            <ScrollArea className="h-72">
            <h2 className="px-4 py-2 font-semibold">Version History</h2>
            <ul className="space-y-1">
                {versions.map(({ version }) => (
                <li key={version}>
                    <Separator />
                    <Button
                    variant="ghost"
                    className={cn("w-full justify-start text-sm", {
                        "text-primary font-bold": activeVersion === version,
                    })}
                    onClick={() => handleScrollToVersion(version)}
                    >
                    v.{version}
                    </Button>
                </li>
                ))}
            </ul>
            </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}
