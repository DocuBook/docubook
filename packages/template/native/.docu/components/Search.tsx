"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search as SearchIcon, FileText, CornerDownLeft, ChevronRight } from "lucide-react";
import { Modal, useModal } from "./base/modal";
import { Input } from "./base/input";
import { Kbd, FnKey } from "./base/kbd";
import { cn } from "../lib/utils";
import { search, type SearchResult } from "../lib/search";
import type { SearchRecord } from "../lib/search-indexer";

interface SearchProps {
  className?: string;
}

let indexCache: SearchRecord[] | null = null;

async function loadIndex(): Promise<SearchRecord[]> {
  if (indexCache) return indexCache;
  const res = await fetch("/assets/search-index.json");
  indexCache = await res.json();
  return indexCache!;
}

export default function Search({ className }: SearchProps) {
  const { ref: modalRef, open, close } = useModal();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [indexLoaded, setIndexLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        open();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // Focus input when modal opens
  useEffect(() => {
    const dialog = modalRef.current;
    if (!dialog) return;

    const observer = new MutationObserver(() => {
      if (dialog.open) {
        setTimeout(() => inputRef.current?.focus(), 50);
        if (!indexLoaded) {
          loadIndex().then(() => setIndexLoaded(true));
        }
      } else {
        setQuery("");
        setResults([]);
        setSelectedIndex(0);
      }
    });
    observer.observe(dialog, { attributes: true, attributeFilter: ["open"] });
    return () => observer.disconnect();
  }, [modalRef, indexLoaded]);

  // Search on query change
  const handleQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);
      if (!indexLoaded || value.trim().length < 2) {
        setResults([]);
        setSelectedIndex(0);
        return;
      }
      setResults(search(value, indexCache!));
      setSelectedIndex(0);
    },
    [indexLoaded]
  );

  // Keyboard navigation inside modal
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (results.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % results.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + results.length) % results.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = results[selectedIndex];
        if (item) {
          window.location.href = item.url;
          close();
        }
      }
    },
    [results, selectedIndex, close]
  );

  // Scroll selected item into view
  useEffect(() => {
    itemRefs.current[selectedIndex]?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  return (
    <div className={className}>
      {/* Search Trigger */}
      <SearchTrigger onClick={open} />

      {/* Search Modal */}
      <Modal
        ref={modalRef}
        placement="top"
        closeOnBackdrop
        className="backdrop:bg-black/40"
        boxClassName="max-w-[640px] p-0 mt-[10vh]"
      >
        <div onKeyDown={handleKeyDown}>
          {/* Search Input */}
          <div className="border-base-300 flex items-center border-b px-4">
            <SearchIcon className="text-base-content/50 h-4 w-4 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={handleQueryChange}
              placeholder="Search documentation..."
              className="placeholder:text-base-content/40 h-14 w-full bg-transparent px-3 text-sm outline-none"
              aria-label="Search documentation"
            />
            <Kbd size="sm" className="shrink-0 text-xs" onClick={close}>
              esc
            </Kbd>
          </div>

          {/* Results */}
          <div className="max-h-[360px] overflow-y-auto px-2 py-2">
            {query.trim().length >= 2 && results.length === 0 && (
              <p className="text-base-content/50 py-8 text-center text-sm">
                No results for &ldquo;<span className="text-primary">{query}</span>&rdquo;
              </p>
            )}

            {results.map((item, index) => (
              <a
                key={item.url + index}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                href={item.url}
                onClick={() => close()}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  index === selectedIndex
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-base-200 text-base-content"
                )}
              >
                <FileText className="h-4 w-4 shrink-0 opacity-50" />
                <div className="min-w-0 flex-1">
                  <div className="text-base-content/50 flex items-center gap-1 text-xs">
                    <span>{item.hierarchy.lvl0}</span>
                    {item.hierarchy.lvl1 && item.hierarchy.lvl1 !== item.title && (
                      <>
                        <ChevronRight className="h-3 w-3" />
                        <span>{item.hierarchy.lvl1}</span>
                      </>
                    )}
                  </div>
                  <div className="truncate font-medium">{item.title}</div>
                  {item.content && (
                    <div className="text-base-content/50 truncate text-xs">{item.content}</div>
                  )}
                </div>
                {index === selectedIndex && (
                  <div className="text-base-content/40 hidden shrink-0 items-center gap-1 text-xs md:flex">
                    <CornerDownLeft className="h-3 w-3" />
                  </div>
                )}
              </a>
            ))}

            {query.trim().length < 2 && (
              <p className="text-base-content/40 py-8 text-center text-sm">
                Type to search documentation
              </p>
            )}
          </div>

          {/* Footer with keyboard hints */}
          <div className="border-base-300 hidden items-center gap-3 border-t px-4 py-2.5 md:flex">
            <div className="flex items-center gap-1">
              <Kbd size="xs">
                <FnKey.Down />
              </Kbd>
              <Kbd size="xs">
                <FnKey.Up />
              </Kbd>
              <span className="text-base-content/50 text-xs">navigate</span>
            </div>
            <div className="flex items-center gap-1">
              <Kbd size="xs">
                <CornerDownLeft className="h-3 w-3" />
              </Kbd>
              <span className="text-base-content/50 text-xs">select</span>
            </div>
            <div className="flex items-center gap-1">
              <Kbd size="xs">
                <FnKey.Esc />
              </Kbd>
              <span className="text-base-content/50 text-xs">close</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center">
      {/* Mobile: icon only */}
      <div className="block p-2 lg:hidden">
        <SearchIcon className="text-base-content/60 h-5 w-5" />
      </div>

      {/* Desktop: input-like trigger */}
      <div className="relative hidden w-full lg:block">
        <SearchIcon className="text-base-content/40 absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        <Input
          readOnly
          placeholder="Search..."
          inputSize="sm"
          className="w-full cursor-pointer pl-9 pr-16"
          tabIndex={-1}
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
          <Kbd size="xs" className="text-[10px]">
            <FnKey.Cmd />
          </Kbd>
          <Kbd size="xs" className="text-[10px]">
            K
          </Kbd>
        </div>
      </div>
    </button>
  );
}
