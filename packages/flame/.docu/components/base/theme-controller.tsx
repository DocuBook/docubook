"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../../lib/utils";

export type ThemeName =
  | "light"
  | "dark"
  | "cupcake"
  | "bumblebee"
  | "emerald"
  | "corporate"
  | "synthwave"
  | "retro"
  | "cyberpunk"
  | "valentine"
  | "halloween"
  | "garden"
  | "forest"
  | "aqua"
  | "lofi"
  | "pastel"
  | "fantasy"
  | "wireframe"
  | "black"
  | "luxury"
  | "dracula"
  | "cmyk"
  | "autumn"
  | "business"
  | "acid"
  | "lemonade"
  | "night"
  | "coffee"
  | "winter"
  | "dim"
  | "nord"
  | "sunset"
  | "razzle"
  | "sizzle";

export interface ThemeOption {
  value: ThemeName;
  label: string;
}

export const DEFAULT_THEMES: ThemeOption[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

/** Hook to get/set current theme */
export function useTheme() {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    if (typeof window === "undefined") return "light";
    return (localStorage.getItem("theme") as ThemeName) || "light";
  });

  useApplyThemeOnMount(theme);

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return { theme, setTheme };
}

function applyTheme(theme: ThemeName) {
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }
}

function useApplyThemeOnMount(theme: ThemeName) {
  const applied = useRef(false);
  useEffect(() => {
    if (!applied.current) {
      applyTheme(theme);
      applied.current = true;
    }
  }, [theme]);
}

interface ThemeControllerToggleProps {
  defaultTheme?: ThemeName;
  lightTheme?: ThemeName;
  darkTheme?: ThemeName;
  onThemeChange?: (theme: ThemeName) => void;
  className?: string;
  label?: ReactNode;
  size?: "xs" | "sm" | "md" | "lg";
  children?: (state: {
    isDark: boolean;
    checked: boolean;
    toggle: (checked: boolean) => void;
  }) => ReactNode;
}

function ThemeControllerToggle({
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
    const stored = localStorage.getItem("theme") as ThemeName | null;
    return (stored || defaultTheme) === darkTheme;
  });

  useApplyThemeOnMount(checked ? darkTheme : lightTheme);

  const handleChange = (newChecked: boolean) => {
    const newTheme = newChecked ? darkTheme : lightTheme;
    setChecked(newChecked);
    applyTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    onThemeChange?.(newTheme);
  };

  const isDark = checked;

  if (children) {
    return <div className={className}>{children({ isDark, checked, toggle: handleChange })}</div>;
  }

  const toggleElement = (
    <input
      type="checkbox"
      className={cn("toggle theme-controller", `toggle-${size}`)}
      checked={checked}
      value={darkTheme}
      onChange={(e) => handleChange(e.target.checked)}
    />
  );

  if (!label) return <div className={className}>{toggleElement}</div>;

  return (
    <label className={cn("flex cursor-pointer items-center gap-3", className)}>
      {toggleElement}
      <span className="text-base-content">{label}</span>
    </label>
  );
}

interface ThemeControllerSelectProps {
  themes?: ThemeOption[];
  value?: ThemeName;
  defaultValue?: ThemeName;
  controlled?: boolean;
  onThemeChange?: (theme: ThemeName) => void;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
  placeholder?: string;
}

function ThemeControllerSelect({
  themes = DEFAULT_THEMES,
  value,
  defaultValue = "light",
  controlled = false,
  onThemeChange,
  className,
  size = "md",
  placeholder = "Choose theme",
}: ThemeControllerSelectProps) {
  const [internalValue, setInternalValue] = useState<ThemeName>(defaultValue as ThemeName);
  const currentValue = controlled ? (value ?? internalValue) : internalValue;
  useApplyThemeOnMount(currentValue as ThemeName);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = e.target.value as ThemeName;
    if (!controlled) {
      setInternalValue(newTheme);
    }
    applyTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    onThemeChange?.(newTheme);
  };

  return (
    <select
      className={cn("select theme-controller", `select-${size}`, className)}
      value={currentValue}
      onChange={handleChange}
      data-choose-theme
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {themes.map((theme) => (
        <option key={theme.value} value={theme.value}>
          {theme.label}
        </option>
      ))}
    </select>
  );
}

interface ThemeControllerRadioProps {
  themes?: ThemeOption[];
  value?: ThemeName;
  defaultValue?: ThemeName;
  controlled?: boolean;
  onThemeChange?: (theme: ThemeName) => void;
  className?: string;
  variant?: "btn" | "tile" | "ghost";
  size?: "xs" | "sm" | "md" | "lg";
}

function ThemeControllerRadio({
  themes = DEFAULT_THEMES,
  value,
  defaultValue = "light",
  controlled = false,
  onThemeChange,
  className,
  variant = "btn",
  size = "md",
}: ThemeControllerRadioProps) {
  const [internalValue, setInternalValue] = useState<ThemeName>(defaultValue as ThemeName);
  const currentValue = controlled ? (value ?? internalValue) : internalValue;
  useApplyThemeOnMount(currentValue as ThemeName);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTheme = e.target.value as ThemeName;
    if (!controlled) {
      setInternalValue(newTheme);
    }
    applyTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    onThemeChange?.(newTheme);
  };

  const variantClass =
    variant === "btn" ? "btn" : variant === "tile" ? "btn btn-tile" : "btn btn-ghost";

  return (
    <div className={cn("flex flex-wrap gap-2", className)} role="radiogroup">
      {themes.map((theme) => (
        <label
          key={theme.value}
          className={cn(variantClass, `btn-${size}`, currentValue === theme.value && "btn-active")}
        >
          <input
            type="radio"
            name="theme"
            className="theme-controller hidden"
            value={theme.value}
            checked={currentValue === theme.value}
            onChange={handleChange}
            aria-label={theme.label}
          />
          {theme.label}
        </label>
      ))}
    </div>
  );
}

interface ThemeControllerProps {
  mode?: "toggle" | "select" | "radio";
  themes?: ThemeOption[];
  value?: ThemeName;
  defaultValue?: ThemeName;
  controlled?: boolean;
  onThemeChange?: (theme: ThemeName) => void;
  className?: string;
  lightTheme?: ThemeName;
  darkTheme?: ThemeName;
  toggleLabel?: ReactNode;
  toggleSize?: "xs" | "sm" | "md" | "lg";
  selectSize?: "xs" | "sm" | "md" | "lg";
  placeholder?: string;
  radioVariant?: "btn" | "tile" | "ghost";
  radioSize?: "xs" | "sm" | "md" | "lg";
}

export function ThemeController({
  mode = "toggle",
  themes = DEFAULT_THEMES,
  value,
  defaultValue = "light",
  controlled = false,
  onThemeChange,
  className,
  lightTheme = "light",
  darkTheme = "dark",
  toggleLabel,
  toggleSize = "md",
  selectSize = "md",
  placeholder = "Choose theme",
  radioVariant = "btn",
  radioSize = "md",
}: ThemeControllerProps) {
  const [internalValue, setInternalValue] = useState<ThemeName>(defaultValue as ThemeName);
  const currentValue = controlled ? (value ?? internalValue) : internalValue;
  useApplyThemeOnMount(currentValue as ThemeName);

  const handleChange = (newTheme: ThemeName) => {
    if (!controlled) {
      setInternalValue(newTheme);
    }
    onThemeChange?.(newTheme);
  };

  switch (mode) {
    case "select":
      return (
        <ThemeControllerSelect
          themes={themes}
          value={value}
          defaultValue={defaultValue}
          controlled={controlled}
          onThemeChange={handleChange}
          className={className}
          size={selectSize}
          placeholder={placeholder}
        />
      );
    case "radio":
      return (
        <ThemeControllerRadio
          themes={themes}
          value={value}
          defaultValue={defaultValue}
          controlled={controlled}
          onThemeChange={handleChange}
          className={className}
          variant={radioVariant}
          size={radioSize}
        />
      );
    case "toggle":
    default:
      return (
        <ThemeControllerToggle
          defaultTheme={defaultValue}
          lightTheme={lightTheme}
          darkTheme={darkTheme}
          onThemeChange={handleChange}
          className={className}
          label={toggleLabel}
          size={toggleSize}
        />
      );
  }
}

export { ThemeControllerToggle, ThemeControllerSelect, ThemeControllerRadio };
export type { ThemeControllerToggleProps, ThemeControllerSelectProps, ThemeControllerRadioProps };
