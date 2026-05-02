"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const subscribe = () => () => undefined;
const getMountedSnapshot = () => true;
const getServerSnapshot = () => false;

export function ModeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    subscribe,
    getMountedSnapshot,
    getServerSnapshot
  );

  // If not mounted, do not render anything to avoid mismatch
  if (!mounted) {
    return (
      <div className="flex items-center gap-1 rounded-full border border-border bg-background/50 p-0.5">
        <div className="rounded-full p-0 w-1 h-1" />
        <div className="rounded-full p-0 w-1 h-1" />
      </div>
    );
  }

  const activeTheme = theme === "system" || !theme ? resolvedTheme : theme;

  const handleToggle = () => {
    if (activeTheme === "light") {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  };

  return (
    <ToggleGroup
      type="single"
      value={activeTheme}
      onValueChange={handleToggle}
      className="flex items-center gap-1 rounded-full border border-border bg-background/50 p-0.5 transition-all"
    >
      <ToggleGroupItem
        value="light"
        size="xs"
        aria-label="Light Mode"
        className={`rounded-full cursor-pointer p-0.5 transition-all ${activeTheme === "light"
          ? "bg-primary text-primary-foreground"
          : "bg-transparent hover:bg-muted/50"
          }`}
      >
        <Sun className="h-0.5 w-0.5" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="dark"
        size="xs"
        aria-label="Dark Mode"
        className={`rounded-full cursor-pointer p-0.5 transition-all ${activeTheme === "dark"
          ? "bg-primary text-primary-foreground"
          : "bg-transparent hover:bg-muted/50"
          }`}
      >
        <Moon className="h-0.5 w-0.5" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
