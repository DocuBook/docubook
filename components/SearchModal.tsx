"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useRef } from "react";
import { ArrowUpIcon, ArrowDownIcon, CornerDownLeftIcon, FileTextIcon } from "lucide-react";
import Anchor from "./anchor";
import { advanceSearch, cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { page_routes } from "@/lib/routes-config";
import {
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogClose,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type ContextInfo = {
  icon: string;
  description: string;
  title?: string;
};

type SearchResult = {
  title: string;
  href: string;
  noLink?: boolean;
  items?: undefined;
  score?: number;
  context?: ContextInfo;
};

const paddingMap = {
  1: "pl-2",
  2: "pl-4",
  3: "pl-10",
} as const;

interface SearchModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function SearchModal({ isOpen, setIsOpen }: SearchModalProps) {
  const router = useRouter();
  const [searchedInput, setSearchedInput] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setSearchedInput("");
    }
  }, [isOpen]);

  const filteredResults = useMemo<SearchResult[]>(() => {
    const trimmedInput = searchedInput.trim();

    if (trimmedInput.length < 3) {
      return page_routes
        .filter((route) => !route.href.endsWith('/'))
        .slice(0, 6)
        .map((route: { title: string; href: string; noLink?: boolean; context?: ContextInfo }) => ({
          title: route.title,
          href: route.href,
          noLink: route.noLink,
          context: route.context,
        }));
    }
    return advanceSearch(trimmedInput) as unknown as SearchResult[];
  }, [searchedInput]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredResults]);

  useEffect(() => {
    const handleNavigation = (event: KeyboardEvent) => {
      if (!isOpen || filteredResults.length === 0) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredResults.length);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % filteredResults.length);
      } else if (event.key === "Enter") {
        event.preventDefault();
        const selectedItem = filteredResults[selectedIndex];
        if (selectedItem) {
          router.push(`/docs${selectedItem.href}`);
          setIsOpen(false);
        }
      }
    };

    window.addEventListener("keydown", handleNavigation);
    return () => window.removeEventListener("keydown", handleNavigation);
  }, [isOpen, filteredResults, selectedIndex, router, setIsOpen]);

  useEffect(() => {
    if (itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedIndex]);

  return (
    <DialogContent className="p-0 max-w-[650px] sm:top-[38%] top-[45%] !rounded-md">
      <DialogHeader>
        <DialogTitle className="sr-only">Search Documentation</DialogTitle>
        <DialogDescription className="sr-only">Search through the documentation</DialogDescription>
      </DialogHeader>
      
      <input
        value={searchedInput}
        onChange={(e) => setSearchedInput(e.target.value)}
        placeholder="Type something to search..."
        autoFocus
        className="h-14 px-6 bg-transparent border-b text-[14px] outline-none w-full"
        aria-label="Search documentation"
      />

      {filteredResults.length == 0 && searchedInput && (
        <p className="text-muted-foreground mx-auto mt-2 text-sm">
          No results found for{" "}
          <span className="text-primary">{`"${searchedInput}"`}</span>
        </p>
      )}
      <ScrollArea className="max-h-[400px] overflow-y-auto">
        <div className="flex flex-col items-start overflow-y-auto sm:px-2 px-1 pb-4">
          {filteredResults.map((item, index) => {
            const level = (item.href.split("/").slice(1).length - 1) as keyof typeof paddingMap;
            const paddingClass = paddingMap[level] || 'pl-2';
            const isActive = index === selectedIndex;

            return (
                <DialogClose key={item.href} asChild>
                    <Anchor
                    ref={(el) => {
                        itemRefs.current[index] = el as HTMLDivElement | null;
                      }}
                    className={cn(
                        "dark:hover:bg-accent/15 hover:bg-accent/10 w-full px-3 rounded-sm text-sm flex items-center gap-2.5",
                        isActive && "bg-primary/20 dark:bg-primary/30",
                        paddingClass
                    )}
                    href={`/docs${item.href}`}
                    tabIndex={-1}
                    >
                    <div
                        className={cn(
                        "flex items-center w-full h-full py-3 gap-1.5 px-2 justify-between",
                        level > 1 && "border-l pl-4"
                        )}
                    >
                        <div className="flex items-center">
                          <FileTextIcon className="h-[1.1rem] w-[1.1rem] mr-1" />
                          <span>{item.title}</span>
                        </div>
                        {isActive && (
                          <div className="hidden md:flex items-center text-xs text-muted-foreground">
                            <span>Return</span>
                            <CornerDownLeftIcon className="h-3 w-3 ml-1" />
                          </div>
                        )}
                    </div>
                    </Anchor>
                </DialogClose>
            );
          })}
        </div>
      </ScrollArea>
      <DialogFooter className="md:flex md:justify-start hidden h-14 px-6 bg-transparent border-t text-[14px] outline-none">
        <div className="flex items-center gap-2">
          <span className="dark:bg-accent/15 bg-slate-200 border rounded p-2">
            <ArrowUpIcon className="w-3 h-3"/>
          </span>
          <span className="dark:bg-accent/15 bg-slate-200 border rounded p-2">
            <ArrowDownIcon className="w-3 h-3"/>
          </span>
          <p className="text-muted-foreground">to navigate</p>
          <span className="dark:bg-accent/15 bg-slate-200 border rounded p-2">
            <CornerDownLeftIcon className="w-3 h-3"/>
          </span>
          <p className="text-muted-foreground">to select</p>
          <span className="dark:bg-accent/15 bg-slate-200 border rounded px-2 py-1">
            esc
          </span>
          <p className="text-muted-foreground">to close</p>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}