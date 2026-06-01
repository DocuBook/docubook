"use client";
import { forwardRef } from "react";
import { cn } from "../utils/cn";
import type { Size } from "../utils/types";

type KbdSize = Size | "xl";

interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  size?: KbdSize;
}

export const Kbd = forwardRef<HTMLElement, KbdProps>(
  ({ children, className, size, ...props }, ref) => (
    <kbd ref={ref} className={cn("kbd", size && `kbd-${size}`, className)} {...props}>
      {children}
    </kbd>
  )
);
Kbd.displayName = "Kbd";

export type { KbdProps, KbdSize };

type IconComponent = React.ComponentType<{ size?: number }>;

export interface FnKeyIcons {
  Command?: IconComponent;
  Option?: IconComponent;
  ChevronUp?: IconComponent;
  ArrowBigUp?: IconComponent;
  CircleArrowOutUpLeft?: IconComponent;
  Space?: IconComponent;
  Delete?: IconComponent;
  ArrowRightToLine?: IconComponent;
  MoveUp?: IconComponent;
  MoveDown?: IconComponent;
  MoveLeft?: IconComponent;
  MoveRight?: IconComponent;
}

let _icons: FnKeyIcons = {};

const iconSize = 12;

function Key({ icon: Icon, entity }: { icon?: IconComponent; entity: string }): React.ReactElement {
  if (Icon) return <Icon size={iconSize} />;
  return <span style={{ fontSize: iconSize }}>{entity}</span>;
}

export const FnKey = {
  configure(icons: FnKeyIcons): void {
    _icons = icons;
  },
  Cmd: () => <Key icon={_icons.Command} entity="⌘" />,
  Option: () => <Key icon={_icons.Option} entity="⌥" />,
  Ctrl: () => <Key icon={_icons.ChevronUp} entity="⌃" />,
  Shift: () => <Key icon={_icons.ArrowBigUp} entity="⇧" />,
  Esc: () => <Key icon={_icons.CircleArrowOutUpLeft} entity="⎋" />,
  Space: () => <Key icon={_icons.Space} entity="␣" />,
  Delete: () => <Key icon={_icons.Delete} entity="⌫" />,
  Tab: () => <Key icon={_icons.ArrowRightToLine} entity="⇥" />,
  Up: () => <Key icon={_icons.MoveUp} entity="↑" />,
  Down: () => <Key icon={_icons.MoveDown} entity="↓" />,
  Left: () => <Key icon={_icons.MoveLeft} entity="←" />,
  Right: () => <Key icon={_icons.MoveRight} entity="→" />,
};
