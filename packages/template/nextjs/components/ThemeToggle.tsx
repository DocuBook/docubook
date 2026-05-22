"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function ModeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // If not mounted, do not render anything to avoid mismatch
  if (!mounted) {
    return (
      <div className="border-border bg-background/50 flex items-center gap-1 rounded-full border p-0.5">
        <div className="h-1 w-1 rounded-full p-0" />
        <div className="h-1 w-1 rounded-full p-0" />
      </div>
    );
  }

  const activeTheme = theme === "system" || !theme ? resolvedTheme : theme;

  const handleToggle = (value: string) => {
    if (!value) return;
    setTheme(value);
  };

  return (
    <ToggleGroup
      type="single"
      value={activeTheme}
      onValueChange={handleToggle}
      className="border-border bg-background/50 flex items-center gap-1 rounded-full border p-0.5 transition-all"
    >
      <ToggleGroupItem
        value="light"
        size="xs"
        aria-label="Light Mode"
        className={`cursor-pointer rounded-full p-0.5 transition-all ${
          activeTheme === "light"
            ? "bg-primary text-primary-foreground"
            : "hover:bg-muted/50 bg-transparent"
        }`}
      >
        <Sun className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="dark"
        size="xs"
        aria-label="Dark Mode"
        className={`cursor-pointer rounded-full p-0.5 transition-all ${
          activeTheme === "dark"
            ? "bg-primary text-primary-foreground"
            : "hover:bg-muted/50 bg-transparent"
        }`}
      >
        <Moon className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
