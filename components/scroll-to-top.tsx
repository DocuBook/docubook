"use client";

import { ArrowUpIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ScrollToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Check if user has scrolled to bottom
      const scrolledToBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100;

      if (scrolledToBottom) {
        setShow(true);
      } else {
        setShow(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      className={cn(
        "lg:hidden fixed top-16 items-center z-50 w-full transition-all duration-300",
        show ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
      )}
    >
      <div className="flex justify-center items-center pt-3 mx-auto">
        <Button
          variant="outline"
          size="sm"
          className="gap-2 rounded-full shadow-md bg-background/80 backdrop-blur-sm border-primary/20 hover:bg-background hover:text-primary"
          onClick={scrollToTop}
        >
          <ArrowUpIcon className="h-4 w-4" />
          <span className="font-medium">Scroll to Top</span>
        </Button>
      </div>
    </div>
  );
}
