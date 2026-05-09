"use client";

import { cn } from "../../utils";
import type { InputHTMLAttributes, ReactNode } from "react";
import { forwardRef, useState, useEffect } from "react";

type ToggleColor = "primary" | "secondary" | "accent" | "neutral" | "success" | "warning" | "info" | "error";
type ToggleSize = "xs" | "sm" | "md" | "lg";

interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {

  color?: ToggleColor;
  size?: ToggleSize;
  label?: ReactNode;
  description?: ReactNode;
  indeterminate?: boolean;
  containerClassName?: string;
  labelClassName?: string;
  descriptionClassName?: string;
}

const Toggle = forwardRef<HTMLInputElement, ToggleProps>(function Toggle(
  {
    color = "primary",
    size = "md",
    label,
    description,
    indeterminate = false,
    containerClassName,
    labelClassName,
    descriptionClassName,
    className,
    disabled,
    checked,
    defaultChecked,
    onChange,
    ...props
  },
  ref
) {
  const colorClass = `toggle-${color}`;
  const sizeClass = `toggle-${size}`;

  useEffect(() => {
    if (ref && "indeterminate" in ref && indeterminate) {
      (ref as HTMLInputElement).indeterminate = true;
    }
  }, [ref, indeterminate]);

  const toggleElement = (
    <input
      ref={ref}
      type="checkbox"
      className={cn(colorClass, sizeClass, className)}
      disabled={disabled}
      checked={checked}
      defaultChecked={defaultChecked}
      onChange={onChange}
      data-indeterminate={indeterminate}
      {...props}
    />
  );

  if (!label) {
    return toggleElement;
  }

  return (
    <label
      className={cn(
        "flex items-start gap-3",
        disabled && "opacity-50 cursor-not-allowed",
        containerClassName
      )}
    >
      <div className="flex items-center pt-0.5">
        {toggleElement}
      </div>
      {(label || description) && (
        <div className="flex flex-col gap-0.5">
          {label && (
            <span className={cn("text-base-content cursor-pointer", labelClassName)}>
              {label}
            </span>
          )}
          {description && (
            <span className={cn("text-sm text-base-content/60", descriptionClassName)}>
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
});

interface ToggleGroupItem {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

interface ToggleGroupProps {
  items: ToggleGroupItem[];
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  color?: ToggleColor;
  size?: ToggleSize;
  controlled?: boolean;
  className?: string;
}

export function ToggleGroup({
  items,
  value,
  defaultValue = [],
  onChange,
  color = "primary",
  size = "md",
  controlled = false,
  className,
}: ToggleGroupProps) {
  const [internalValue, setInternalValue] = useState<string[]>(defaultValue);
  const selectedValues = controlled ? value ?? internalValue : internalValue;

  const toggle = (itemValue: string) => {
    const next = selectedValues.includes(itemValue)
      ? selectedValues.filter((v) => v !== itemValue)
      : [...selectedValues, itemValue];

    if (!controlled) {
      setInternalValue(next);
    }
    onChange?.(next);
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {items.map((item) => {
        const isSelected = selectedValues.includes(item.value);
        return (
          <label
            key={item.value}
            className={cn(
              "flex items-center gap-3",
              item.disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <input
              type="checkbox"
              className={cn(`toggle-${color}`, `toggle-${size}`)}
              checked={isSelected}
              disabled={item.disabled}
              onChange={() => !item.disabled && toggle(item.value)}
            />
            <span className="text-base-content cursor-pointer">
              {item.label}
            </span>
          </label>
        );
      })}
    </div>
  );
}

export { Toggle };
export type { ToggleProps, ToggleGroupProps, ToggleGroupItem, ToggleColor, ToggleSize };
