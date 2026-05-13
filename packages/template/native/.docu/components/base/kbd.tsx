import { forwardRef } from "react";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Command,
  Option,
  ChevronUp,
  ArrowBigUp,
  CircleArrowOutUpLeft,
  Space,
  Delete,
  ArrowRightToLine,
} from "lucide-react";
import { cn } from "../../lib/utils";

type KbdSize = "xs" | "sm" | "md" | "lg" | "xl";

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

const iconSize = 12;

export const FnKey = {
  Cmd: () => <Command size={iconSize} />,
  Option: () => <Option size={iconSize} />,
  Ctrl: () => <ChevronUp size={iconSize} />,
  Shift: () => <ArrowBigUp size={iconSize} />,
  Esc: () => <CircleArrowOutUpLeft size={iconSize} />,
  Space: () => <Space size={iconSize} />,
  Delete: () => <Delete size={iconSize} />,
  Tab: () => <ArrowRightToLine size={iconSize} />,
  Up: () => <ArrowUp size={iconSize} />,
  Down: () => <ArrowDown size={iconSize} />,
  Left: () => <ArrowLeft size={iconSize} />,
  Right: () => <ArrowRight size={iconSize} />,
};
