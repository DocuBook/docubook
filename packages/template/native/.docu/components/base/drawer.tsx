"use client";

import { cn } from "../../utils";
import { X } from "lucide-react";
import { useState, type ReactNode } from "react";

type DrawerSide = "left" | "right";

interface DrawerProps {
  id: string;
  children: ReactNode;
  defaultOpen?: boolean;
  side?: DrawerSide;
  breakpoint?: string;
  withOverlay?: boolean;
  overlayClassName?: string;
  sideClassName?: string;
  contentClassName?: string;
  className?: string;
}

export default function Drawer({
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

  const sidePositionClass = side === "right" ? "drawer-end" : "";

  return (
    <div className={cn("drawer", breakpoint ? `${breakpoint}:drawer-open` : "", sidePositionClass, className)}>
      <input
        id={id}
        type="checkbox"
        className="drawer-toggle"
        checked={isOpen}
        onChange={toggleDrawer}
        aria-label="Toggle drawer"
      />

      <div className={cn("drawer-content flex flex-col", contentClassName)}>
        {typeof children === "function"
          ? (children as (props: { open: boolean; toggle: () => void; close: () => void }) => ReactNode)({ open: isOpen, toggle: toggleDrawer, close: closeDrawer })
          : children}
      </div>

      <div className={cn("drawer-side", sideClassName)}>
        {withOverlay && (
          <label
            htmlFor={id}
            aria-label="Close sidebar"
            className={cn("drawer-overlay", overlayClassName)}
            onClick={closeDrawer}
          />
        )}

        <div className="min-h-full w-80 bg-base-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-lg">Menu</span>
            <button
              onClick={closeDrawer}
              className="btn btn-ghost btn-sm btn-circle"
              aria-label="Close drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
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

export function DrawerTrigger({
  drawerId,
  children,
  className,
}: DrawerTriggerProps) {
  return (
    <label htmlFor={drawerId} className={cn("label cursor-pointer", className)}>
      {children}
    </label>
  );
}

interface DrawerContentProps {
  children: ReactNode;
  className?: string;
}

export function DrawerContent({ children, className }: DrawerContentProps) {
  return <div className={cn("drawer-content", className)}>{children}</div>;
}

interface DrawerSidePanelProps {
  id: string;
  children: ReactNode;
  side?: DrawerSide;
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
    <div className={cn("drawer-side", side === "right" ? "drawer-end" : "", className)}>
      {withOverlay && (
        <label htmlFor={id} aria-label="Close sidebar" className={cn("drawer-overlay", overlayClassName)} />
      )}
      {children}
    </div>
  );
}

export { Drawer };
export type { DrawerProps, DrawerSide };