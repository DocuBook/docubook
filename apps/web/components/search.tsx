"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { SearchTrigger } from "@/components/SearchTrigger";
import { SearchModal } from "@/components/SearchModal";
import DocSearchComponent from "@/components/DocSearch";
import { DialogTrigger } from "@radix-ui/react-dialog";

interface SearchProps {
  /**
   * Specify which search engine to use.
   * @default 'default'
   */
  type?: "default" | "algolia";
}

export default function Search({ type = "default" }: SearchProps) {
  const [isOpen, setIsOpen] = useState(false);

  // The useEffect below is ONLY for the 'default' type, which is correct.
  // DocSearch handles its own keyboard shortcut.
  useEffect(() => {
    if (type === 'default') {
      const handleKeyDown = (event: KeyboardEvent) => {
        if ((event.ctrlKey || event.metaKey) && event.key === "k") {
          event.preventDefault();
          setIsOpen((open) => !open);
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [type]);

  if (type === "algolia") {
    // Just render the component without passing any state props
    return <DocSearchComponent />;
  }

  // Logic for 'default' search
  return (
    <div>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <SearchTrigger />
        </DialogTrigger>
        <SearchModal isOpen={isOpen} setIsOpen={setIsOpen} />
      </Dialog>
    </div>
  );
}