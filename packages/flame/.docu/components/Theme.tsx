"use client";

import { Moon, Sun } from "lucide-react";
import { ThemeControllerToggle } from "./base/theme-controller";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  return (
    <ThemeControllerToggle lightTheme="light" darkTheme="dark">
      {({ isDark, toggle }) => (
        <div
          className={`border-base-600 dark:border-base-content/20 bg-base-100/50 flex items-center gap-1 rounded-full border p-0.5 transition-all ${className || ""}`}
        >
          <button
            type="button"
            role="switch"
            aria-label="Light mode"
            aria-checked={!isDark}
            onClick={() => toggle(false)}
            className="bg-primary cursor-pointer rounded-full p-0.5 transition-all dark:bg-transparent"
          >
            <Sun
              className={`h-4 w-4 transition-colors ${
                !isDark ? "text-base-300" : "text-foreground"
              }`}
            />
          </button>
          <button
            type="button"
            role="switch"
            aria-label="Dark mode"
            aria-checked={isDark}
            onClick={() => toggle(true)}
            className="dark:bg-primary cursor-pointer rounded-full p-0.5 transition-all"
          >
            <Moon
              className={`h-4 w-4 transition-colors ${
                isDark ? "text-foreground" : "text-base-content/60"
              }`}
            />
          </button>
        </div>
      )}
    </ThemeControllerToggle>
  );
}
