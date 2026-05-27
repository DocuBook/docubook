"use client";

import { cn } from "../cn";
import { useState, type ReactNode } from "react";
import type { Side } from "../types";

interface DrawerProps {
  id: string;
  children: ReactNode;
  defaultOpen?: boolean;
  side?: Side;
  breakpoint?: string;
  withOverlay?: boolean;
  overlayClassName?: string;
  sideClassName?: string;
  contentClassName?: string;
  className?: string;
}

export function Drawer({
  id,
  children,
  defaultOpen = false,
  side = "left",
  breakpoint = "lg",
  withOverlay = true,
  overlayClassName,
  sideClassName,
  contentClassName,
  className,
}: DrawerProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggleDrawer = () => setIsOpen(!isOpen);
  const closeDrawer = () => setIsOpen(false);

  return (
    <div
      className={cn(
        "drawer",
        breakpoint && `${breakpoint}:drawer-open`,
        side === "right" && "drawer-end",
        className
      )}
    >
      <input
        id={id}
        type="checkbox"
        className="drawer-toggle"
        checked={isOpen}
        onChange={toggleDrawer}
        aria-label="Toggle drawer"
      />
      <div className={cn("drawer-content flex flex-col", contentClassName)}>{children}</div>
      <div className={cn("drawer-side", sideClassName)}>
        {withOverlay && (
          <label
            htmlFor={id}
            aria-label="Close sidebar"
            className={cn("drawer-overlay", overlayClassName)}
            onClick={closeDrawer}
          />
        )}
      </div>
    </div>
  );
}

export function useDrawerState(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);
  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  };
}

interface DrawerTriggerProps {
  drawerId: string;
  children: ReactNode;
  className?: string;
}

export function DrawerTrigger({ drawerId, children, className }: DrawerTriggerProps) {
  return (
    <label htmlFor={drawerId} className={cn("label cursor-pointer", className)}>
      {children}
    </label>
  );
}

interface DrawerSidePanelProps {
  id: string;
  children: ReactNode;
  side?: Side;
  withOverlay?: boolean;
  overlayClassName?: string;
  className?: string;
}

export function DrawerSidePanel({
  id,
  children,
  side = "left",
  withOverlay = true,
  overlayClassName,
  className,
}: DrawerSidePanelProps) {
  return (
    <div className={cn("drawer-side", side === "right" && "drawer-end", className)}>
      {withOverlay && (
        <label
          htmlFor={id}
          aria-label="Close sidebar"
          className={cn("drawer-overlay", overlayClassName)}
        />
      )}
      {children}
    </div>
  );
}

export type { DrawerProps, DrawerTriggerProps, DrawerSidePanelProps };
