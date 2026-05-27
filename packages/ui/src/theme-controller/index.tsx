"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../cn";
import type { Size } from "../types";

export type ThemeName = string;

export interface ThemeOption {
  value: string;
  label: string;
}

export const DEFAULT_THEMES: ThemeOption[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

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

export function useTheme(defaultTheme = "light") {
  const [theme, setThemeState] = useState<string>(() => {
    if (typeof window === "undefined") {
      return defaultTheme;
    }
    return localStorage.getItem("theme") || defaultTheme;
  });

  useApplyThemeOnMount(theme);

  const setTheme = (newTheme: string) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return { theme, setTheme };
}

interface ThemeControllerProps {
  mode?: "toggle" | "select" | "radio";
  themes?: ThemeOption[];
  defaultValue?: string;
  onThemeChange?: (theme: string) => void;
  className?: string;
  lightTheme?: string;
  darkTheme?: string;
  label?: ReactNode;
  size?: Size;
  placeholder?: string;
}

export function ThemeController({
  mode = "toggle",
  themes = DEFAULT_THEMES,
  defaultValue = "light",
  onThemeChange,
  className,
  lightTheme = "light",
  darkTheme = "dark",
  label,
  size = "md",
  placeholder = "Choose theme",
}: ThemeControllerProps) {
  const [current, setCurrent] = useState<string>(() => {
    if (typeof window === "undefined") {
      return defaultValue;
    }
    return localStorage.getItem("theme") || defaultValue;
  });

  useApplyThemeOnMount(current);

  const handleChange = (newTheme: string) => {
    setCurrent(newTheme);
    applyTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    onThemeChange?.(newTheme);
  };

  if (mode === "select") {
    return (
      <select
        className={cn("select theme-controller", `select-${size}`, className)}
        value={current}
        onChange={(e) => handleChange(e.target.value)}
        data-choose-theme
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {themes.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
    );
  }

  if (mode === "radio") {
    return (
      <div className={cn("flex flex-wrap gap-2", className)} role="radiogroup">
        {themes.map((t) => (
          <label
            key={t.value}
            className={cn("btn", `btn-${size}`, current === t.value && "btn-active")}
          >
            <input
              type="radio"
              name="theme"
              className="theme-controller hidden"
              value={t.value}
              checked={current === t.value}
              onChange={(e) => handleChange(e.target.value)}
              aria-label={t.label}
            />
            {t.label}
          </label>
        ))}
      </div>
    );
  }

  // Toggle mode
  const checked = current === darkTheme;
  return (
    <label className={cn("flex cursor-pointer items-center gap-3", className)}>
      <input
        type="checkbox"
        className={cn("toggle theme-controller", `toggle-${size}`)}
        checked={checked}
        value={darkTheme}
        onChange={(e) => handleChange(e.target.checked ? darkTheme : lightTheme)}
      />
      {label && <span className="text-base-content">{label}</span>}
    </label>
  );
}

export type { ThemeControllerProps };
