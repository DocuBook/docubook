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
          className={`flex items-center gap-1 rounded-full border border-base-content/20 bg-base-100/50 p-0.5 transition-all ${className || ""}`}
        >
          <button
            type="button"
            role="switch"
            aria-label="Light mode"
            aria-checked={!isDark}
            onClick={() => toggle(false)}
            className="cursor-pointer rounded-full p-0.5 transition-all hover:bg-base-content/10"
          >
            <Sun
              className={`h-4 w-4 transition-colors ${
                !isDark ? "text-primary" : "text-base-content/60"
              }`}
            />
          </button>
          <button
            type="button"
            role="switch"
            aria-label="Dark mode"
            aria-checked={isDark}
            onClick={() => toggle(true)}
            className="cursor-pointer rounded-full p-0.5 transition-all hover:bg-base-content/10"
          >
            <Moon
              className={`h-4 w-4 transition-colors ${
                isDark ? "text-primary" : "text-base-content/60"
              }`}
            />
          </button>
        </div>
      )}
    </ThemeControllerToggle>
  );
}