"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { SearchTrigger } from "@/components/SearchTrigger";
import { SearchModal } from "@/components/SearchModal";

// Define props for the Search component
interface SearchProps {
  /**
   * Specify the type of search engine to use.
   * @default 'default'
   */
  type?: "default" | "algolia";
}

export default function Search({ type = "default" }: SearchProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Effect to handle keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
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
  }, []);

  // Here you can add logic for different search types if needed in the future
  if (type === "algolia") {
    // return <AlgoliaSearchComponent />; // Example for future implementation
    console.warn("Tipe pencarian 'algolia' belum diimplementasikan.");
    // For now, we will fall back to the default search implementation
  }

  // Render the default search components
  return (
    <div>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <SearchTrigger />
        <SearchModal isOpen={isOpen} setIsOpen={setIsOpen} />
      </Dialog>
    </div>
  );
}