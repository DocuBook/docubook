"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function ModeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Untuk menghindari hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Jika belum mounted, jangan render apapun untuk menghindari mismatch
  if (!mounted) {
    return (
      <div className="flex items-center gap-1 rounded-full border border-border bg-background/50 p-1">
        <div className="rounded-full p-1 w-8 h-8" />
        <div className="rounded-full p-1 w-8 h-8" />
      </div>
    );
  }

  // Tentukan theme yang aktif: gunakan resolvedTheme untuk menampilkan ikon yang sesuai
  // jika theme === "system", resolvedTheme akan menjadi "light" atau "dark" sesuai device
  const activeTheme = theme === "system" || !theme ? resolvedTheme : theme;

  const handleToggle = () => {
    // Toggle antara light dan dark
    // Jika sekarang light, ganti ke dark, dan sebaliknya
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
      className="flex items-center gap-1 rounded-full border border-border bg-background/50 p-1 transition-all"
    >
      <ToggleGroupItem
        value="light"
        size="sm"
        aria-label="Light Mode"
        className={`rounded-full p-1 transition-all ${activeTheme === "light"
          ? "bg-primary text-primary-foreground"
          : "bg-transparent hover:bg-muted/50"
          }`}
      >
        <Sun className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="dark"
        size="sm"
        aria-label="Dark Mode"
        className={`rounded-full p-1 transition-all ${activeTheme === "dark"
          ? "bg-primary text-primary-foreground"
          : "bg-transparent hover:bg-muted/50"
          }`}
      >
        <Moon className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
