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

const iconSize = 12;

export const FnKey = {
  Cmd: () => <span style={{ fontSize: iconSize }}>⌘</span>,
  Option: () => <span style={{ fontSize: iconSize }}>⌥</span>,
  Ctrl: () => <span style={{ fontSize: iconSize }}>⌃</span>,
  Shift: () => <span style={{ fontSize: iconSize }}>⇧</span>,
  Esc: () => <span style={{ fontSize: iconSize }}>⎋</span>,
  Space: () => <span style={{ fontSize: iconSize }}>␣</span>,
  Delete: () => <span style={{ fontSize: iconSize }}>⌫</span>,
  Tab: () => <span style={{ fontSize: iconSize }}>⇥</span>,
  Up: () => <span style={{ fontSize: iconSize }}>↑</span>,
  Down: () => <span style={{ fontSize: iconSize }}>↓</span>,
  Left: () => <span style={{ fontSize: iconSize }}>←</span>,
  Right: () => <span style={{ fontSize: iconSize }}>→</span>,
};
