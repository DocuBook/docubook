"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useRef } from "react";
import { ArrowUpIcon, ArrowDownIcon, CommandIcon, FileTextIcon, SearchIcon, CornerDownLeftIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTrigger,
  DialogClose,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Anchor from "./anchor";
import { advanceSearch, cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { page_routes } from "@/lib/routes-config";

// Define the ContextInfo type to match the one in routes-config
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

export default function Search() {
  const router = useRouter();
  const [searchedInput, setSearchedInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const filteredResults = useMemo<SearchResult[]>(() => {
    const trimmedInput = searchedInput.trim();

    // If search input is empty or less than 3 characters, show initial suggestions
    if (trimmedInput.length < 3) {
      return page_routes
        .filter((route: { href: string }) => !route.href.endsWith('/')) // Filter out directory routes
        .slice(0, 6) // Limit to 6 posts
        .map((route: { title: string; href: string; noLink?: boolean; context?: ContextInfo }) => ({
          title: route.title,
          href: route.href,
          noLink: route.noLink,
          context: route.context
        }));
    }

    // For search with 3 or more characters, use the advance search
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
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % filteredResults.length);
      }

      if (event.key === "Enter") {
        event.preventDefault();
        const selectedItem = filteredResults[selectedIndex];
        if (selectedItem) {
          router.push(`/docs${selectedItem.href}`);
          setIsOpen(false);
        }
      }
    };

    window.addEventListener("keydown", handleNavigation);
    return () => {
      window.removeEventListener("keydown", handleNavigation);
    };
  }, [isOpen, filteredResults, selectedIndex, router]);

    useEffect(() => {
    if (itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedIndex]);

  return (
    <div>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) setSearchedInput("");
          setIsOpen(open);
        }}
      >
        <DialogTrigger asChild>
          <div className="relative flex-1 cursor-pointer max-w-[140px]">
            <div className="flex items-center">
              <div className="md:hidden p-2 -ml-2">
                <SearchIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="hidden md:block w-full">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="w-full rounded-full dark:bg-background/95 bg-background border h-9 pl-10 pr-0 sm:pr-4 text-sm shadow-sm overflow-ellipsis"
                  placeholder="Search"
                  type="search"
                />
                <div className="flex absolute top-1/2 -translate-y-1/2 right-2 text-xs font-medium font-mono items-center gap-0.5 dark:bg-accent bg-accent text-white px-2 py-0.5 rounded-full">
                  <CommandIcon className="w-3 h-3" />
                  <span>K</span>
                </div>
              </div>
            </div>
          </div>
        </DialogTrigger>
        <DialogContent className="p-0 max-w-[650px] sm:top-[38%] top-[45%] !rounded-md">
          <DialogHeader>
            <DialogTitle className="sr-only">Search Documentation</DialogTitle>
          </DialogHeader>
            <DialogDescription className="sr-only">
              Search through the documentation
            </DialogDescription>
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
                const paddingClass = paddingMap[level];
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
                        tabIndex={0}
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
      </Dialog>
    </div>
  );
}

const paddingMap = {
  1: "pl-2",
  2: "pl-4",
  3: "pl-10",
} as const;
