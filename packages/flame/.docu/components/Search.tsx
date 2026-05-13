"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search as SearchIcon, FileText, CornerDownLeft, Hash, AlignLeft } from "lucide-react";
import { Modal, useModal } from "./base/modal";
import { Kbd, FnKey } from "./base/kbd";
import { cn } from "../lib/utils";
import { search, type SearchResult } from "../lib/search";
import type { SearchRecord } from "../lib/search-indexer";

interface SearchProps {
  className?: string;
}

let indexCache: SearchRecord[] | null = null;
let cmdKRegistered = false;

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

  useEffect(() => {
    if (cmdKRegistered) return;
    cmdKRegistered = true;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const dialog = modalRef.current;
        if (dialog?.open) {
          close();
        } else {
          open();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      cmdKRegistered = false;
    };
  }, [open, close, modalRef]);

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

  useEffect(() => {
    itemRefs.current[selectedIndex]?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  return (
    <div className={className}>
      <SearchTrigger onClick={open} />
      <Modal
        ref={modalRef}
        closeOnBackdrop
        className="items-start pt-[15vh] backdrop:bg-black/40"
        boxClassName="w-[calc(100%-2rem)] max-w-[640px] p-0 mx-auto relative z-10"
      >
        <div onKeyDown={handleKeyDown}>
          <div className="px-4 pt-4 pb-2">
            <div className="border-base-300 flex items-center gap-3 rounded-lg border px-4 py-2.5">
              <SearchIcon className="text-primary h-5 w-5 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={handleQueryChange}
                placeholder="Search documentation..."
                autoFocus
                className="placeholder:text-base-content/40 h-8 w-full border-none bg-transparent text-base ring-0 outline-none focus:ring-0 focus:outline-none"
                aria-label="Search documentation"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setResults([]);
                    inputRef.current?.focus();
                  }}
                  className="text-primary hover:text-primary/80 shrink-0 text-xs"
                >
                  Clear
                </button>
              )}
              <button type="button" onClick={close} className="shrink-0">
                <Kbd size="sm" className="hover:bg-base-200 cursor-pointer text-xs">
                  esc
                </Kbd>
              </button>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto px-3 py-2">
            {query.trim().length >= 2 && results.length === 0 && (
              <p className="text-base-content/50 py-8 text-center text-sm">
                No results for &ldquo;<span className="text-primary">{query}</span>&rdquo;
              </p>
            )}

            {query.trim().length >= 2 && results.length > 0 && (
              <GroupedResults
                results={results}
                selectedIndex={selectedIndex}
                itemRefs={itemRefs}
                onSelect={close}
              />
            )}

            {query.trim().length < 2 && (
              <p className="text-base-content/40 py-8 text-center text-sm">
                Type to search documentation
              </p>
            )}
          </div>

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
              <Kbd size="xs">esc</Kbd>
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
      <div className="block p-2 lg:hidden">
        <SearchIcon className="text-base-content/60 h-5 w-5" />
      </div>
      <div className="relative hidden w-full lg:block">
        <div className="border-base-300 bg-base-200/50 text-base-content/50 hover:border-base-content/20 hover:bg-base-200 flex h-9 w-full items-center gap-2 rounded-full border px-3 text-sm transition-colors">
          <SearchIcon className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">Search</span>
          <div className="flex items-center gap-0.5">
            <Kbd
              size="s"
              className="bg-primary text-[12px text-base-300 rounded-md p-1.5 font-medium"
            >
              <FnKey.Cmd />
            </Kbd>
            <Kbd
              size="s"
              className="bg-primary text-base-300 rounded-md p-1.5 text-[12px] font-medium"
            >
              K
            </Kbd>
          </div>
        </div>
      </div>
    </button>
  );
}

function GroupedResults({
  results,
  selectedIndex,
  itemRefs,
  onSelect,
}: {
  results: SearchResult[];
  selectedIndex: number;
  itemRefs: React.MutableRefObject<(HTMLAnchorElement | null)[]>;
  onSelect: () => void;
}) {
  // Group results by lvl0
  const groups: { section: string; items: { result: SearchResult; globalIndex: number }[] }[] = [];
  let currentSection = "";

  results.forEach((result, index) => {
    const section = result.hierarchy.lvl0;
    if (section !== currentSection) {
      groups.push({ section, items: [] });
      currentSection = section;
    }
    groups[groups.length - 1].items.push({ result, globalIndex: index });
  });

  return (
    <div className="flex flex-col gap-1">
      {groups.map((group) => (
        <div key={group.section}>
          <div className="text-base-content/50 px-2 pt-3 pb-1 text-xs font-semibold">
            {group.section}
          </div>
          {group.items.map(({ result, globalIndex }) => {
            const isActive = globalIndex === selectedIndex;
            const isPage = result.type === "lvl1";
            const isContent = result.type === "content";
            const isHeading = !isPage && !isContent;
            const parentLabel = isPage ? null : result.hierarchy.lvl1;

            return (
              <a
                key={result.url + globalIndex}
                ref={(el) => {
                  itemRefs.current[globalIndex] = el;
                }}
                href={result.url}
                onClick={onSelect}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "hover:bg-base-200 text-base-content"
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded border",
                    isActive ? "border-primary/30 bg-primary/5" : "border-base-300 bg-base-200/50"
                  )}
                >
                  {isPage && <FileText className="h-3.5 w-3.5" />}
                  {isHeading && <Hash className="h-3.5 w-3.5" />}
                  {isContent && <AlignLeft className="h-3.5 w-3.5" />}
                </div>

                {/* Text */}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">
                    {isContent ? result.content : result.title}
                  </div>
                  {parentLabel && parentLabel !== result.title && (
                    <div className="text-base-content/50 truncate text-xs">{parentLabel}</div>
                  )}
                </div>

                {/* Return icon on active */}
                {isActive && <CornerDownLeft className="text-primary/60 h-4 w-4 shrink-0" />}
              </a>
            );
          })}
        </div>
      ))}
    </div>
  );
}
