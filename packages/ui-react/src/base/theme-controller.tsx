"use client";

import { useEffect, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils/cn";
import type { Size } from "../utils/types";

function readStoredTheme(): string | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("theme");
  } catch {
    return null;
  }
}

function applyTheme(isDark: boolean) {
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", isDark);
  }
}

function writeStoredTheme(theme: string) {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("theme", theme);
    }
  } catch {
    // Storage can be unavailable (private mode, blocked cookies); theme still applies in-memory.
  }
}

// --- ThemeControllerToggle ---

export interface ThemeControllerToggleProps {
  defaultTheme?: string;
  lightTheme?: string;
  darkTheme?: string;
  ariaLabel?: string;
  inputProps?: Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "type" | "checked" | "onChange" | "value"
  >;
  onThemeChange?: (theme: string) => void;
  className?: string;
  label?: ReactNode;
  size?: Size;
  children?: (state: {
    isDark: boolean;
    checked: boolean;
    toggle: (checked: boolean) => void;
  }) => ReactNode;
}

export function ThemeControllerToggle({
  defaultTheme = "light",
  lightTheme = "light",
  darkTheme = "dark",
  ariaLabel = "Toggle dark mode",
  inputProps,
  onThemeChange,
  className,
  label,
  size = "md",
  children,
}: ThemeControllerToggleProps) {
  // Deterministic initial render so SSR and hydration match. Stored theme syncs after mount.
  const [checked, setChecked] = useState(() => defaultTheme === darkTheme);

  useEffect(() => {
    const storedTheme = readStoredTheme() ?? defaultTheme;
    const isDark = storedTheme === darkTheme;
    setChecked(isDark);
    applyTheme(isDark);
  }, [defaultTheme, darkTheme]);

  const handleChange = (newChecked: boolean) => {
    const newTheme = newChecked ? darkTheme : lightTheme;
    setChecked(newChecked);
    applyTheme(newChecked);
    writeStoredTheme(newTheme);
    onThemeChange?.(newTheme);
  };

  if (children) {
    return (
      <div className={className}>
        {children({ isDark: checked, checked, toggle: handleChange })}
      </div>
    );
  }

  const toggleEl = (
    <input
      type="checkbox"
      className={cn("toggle theme-controller", `toggle-${size}`)}
      checked={checked}
      value={darkTheme}
      aria-label={ariaLabel}
      onChange={(e) => handleChange(e.target.checked)}
      {...inputProps}
    />
  );

  if (!label) return <div className={className}>{toggleEl}</div>;
  return (
    <label className={cn("flex cursor-pointer items-center gap-3", className)}>
      {toggleEl}
      <span className="text-base-content">{label}</span>
    </label>
  );
}
