import { forwardRef } from "react";
import { cn } from "../../lib/utils";

type InputColor =
  | "neutral"
  | "primary"
  | "secondary"
  | "accent"
  | "info"
  | "success"
  | "warning"
  | "error";
type InputSize = "xs" | "sm" | "md" | "lg" | "xl";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  color?: InputColor;
  inputSize?: InputSize;
  ghost?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, color, inputSize, ghost, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "input",
          ghost && "input-ghost",
          color && `input-${color}`,
          inputSize && `input-${inputSize}`,
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

interface InputGroupProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

export const InputGroup = forwardRef<HTMLLabelElement, InputGroupProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <label ref={ref} className={cn("input", className)} {...props}>
        {children}
      </label>
    );
  }
);
InputGroup.displayName = "InputGroup";
