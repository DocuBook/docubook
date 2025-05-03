"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = React.useState<string>("system");

  // Pastikan toggle tetap di posisi yang benar setelah reload
  React.useEffect(() => {
    if (theme) {
      setSelectedTheme(theme);
    } else {
      setSelectedTheme("system"); // Default ke system jika undefined
    }
  }, [theme]);

  return (
    <ToggleGroup
      type="single"
      value={selectedTheme}
      onValueChange={(value) => {
        if (value) {
          setTheme(value);
          setSelectedTheme(value);
        }
      }}
      className="flex items-center gap-1 rounded-full border border-gray-300 dark:border-gray-700 p-1 transition-all"
    >
      <ToggleGroupItem
        value="light"
        size="sm"
        aria-label="Light Mode"
        className={`rounded-full p-1 transition-all ${
          selectedTheme === "light"
            ? "bg-blue-500 text-white"
            : "bg-transparent"
        }`}
      >
        <Sun className={`h-4 w-4 ${selectedTheme === "light" ? "text-white" : "text-gray-600 dark:text-gray-300"}`} />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="system"
        size="sm"
        aria-label="System Mode"
        className={`rounded-full p-1 transition-all ${
          selectedTheme === "system"
            ? "bg-blue-500 text-white"
            : "bg-transparent"
        }`}
      >
        <Monitor className={`h-4 w-4 ${selectedTheme === "system" ? "text-white" : "text-gray-600 dark:text-gray-300"}`} />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="dark"
        size="sm"
        aria-label="Dark Mode"
        className={`rounded-full p-1 transition-all ${
          selectedTheme === "dark"
            ? "bg-blue-500 text-white"
            : "bg-transparent"
        }`}
      >
        <Moon className={`h-4 w-4 ${selectedTheme === "dark" ? "text-white" : "text-gray-600 dark:text-gray-300"}`} />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
