import { forwardRef } from "react";
import { cn } from "../cn";
import type { Size } from "../types";

type KbdSize = Size | "xl";

interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  size?: KbdSize;
}

export const Kbd = forwardRef<HTMLElement, KbdProps>(
  ({ children, className, size, ...props }, ref) => {
    return (
      <kbd ref={ref} className={cn("kbd", size && `kbd-${size}`, className)} {...props}>
        {children}
      </kbd>
    );
  }
);
Kbd.displayName = "Kbd";

export type { KbdProps, KbdSize };
