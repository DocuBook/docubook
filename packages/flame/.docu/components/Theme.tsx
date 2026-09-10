"use client";

import { Moon, Sun } from "lucide-react";
import { ThemeControllerToggle } from "@docubook/ui-react/theme-controller";

interface ThemeButtonsProps {
  className?: string;
  isDark: boolean;
  toggle?: (dark: boolean) => void;
  native?: boolean;
}

function ThemeButtons({ className, isDark, toggle, native }: ThemeButtonsProps) {
  return (
    <div
      className={`border-base-600 dark:border-base-content/20 bg-base-100/50 flex items-center gap-1 rounded-full border p-0.5 transition-all ${className || ""}`}
    >
      <button
        type="button"
        role="switch"
        aria-label="Light mode"
        aria-checked={!isDark}
        onClick={toggle ? () => toggle(false) : undefined}
        data-theme-value={native ? "light" : undefined}
        className="bg-primary cursor-pointer rounded-full p-0.5 transition-all dark:bg-transparent"
      >
        <Sun
          className={`h-4 w-4 transition-colors ${
            !isDark ? "text-primary-foreground" : "text-foreground"
          }`}
        />
      </button>
      <button
        type="button"
        role="switch"
        aria-label="Dark mode"
        aria-checked={isDark}
        onClick={toggle ? () => toggle(true) : undefined}
        data-theme-value={native ? "dark" : undefined}
        className="dark:bg-primary cursor-pointer rounded-full p-0.5 transition-all"
      >
        <Moon
          className={`h-4 w-4 transition-colors ${
            isDark ? "text-primary-foreground" : "text-base-content/60"
          }`}
        />
      </button>
    </div>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  return (
    <ThemeControllerToggle lightTheme="light" darkTheme="dark">
      {({ isDark, toggle }) => (
        <ThemeButtons className={className} isDark={isDark} toggle={toggle} />
      )}
    </ThemeControllerToggle>
  );
}

export function NativeThemeToggle({ className }: { className?: string }) {
  return <ThemeButtons className={className} isDark={false} native />;
}
