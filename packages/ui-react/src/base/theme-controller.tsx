"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../utils/cn";
import type { Size } from "../utils/types";

function applyTheme(theme: string) {
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }
}

function useApplyThemeOnMount(theme: string) {
  const applied = useRef(false);
  useEffect(() => {
    if (!applied.current) {
      applyTheme(theme);
      applied.current = true;
    }
  }, [theme]);
}

// --- ThemeControllerToggle ---

export interface ThemeControllerToggleProps {
  defaultTheme?: string;
  lightTheme?: string;
  darkTheme?: string;
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
  onThemeChange,
  className,
  label,
  size = "md",
  children,
}: ThemeControllerToggleProps) {
  const [checked, setChecked] = useState(() => {
    if (typeof window === "undefined") return false;
    return (localStorage.getItem("theme") || defaultTheme) === darkTheme;
  });
  useApplyThemeOnMount(checked ? darkTheme : lightTheme);

  const handleChange = (newChecked: boolean) => {
    const newTheme = newChecked ? darkTheme : lightTheme;
    setChecked(newChecked);
    applyTheme(newTheme);
    localStorage.setItem("theme", newTheme);
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
      onChange={(e) => handleChange(e.target.checked)}
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
