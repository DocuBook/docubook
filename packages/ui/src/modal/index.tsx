"use client";

import { forwardRef, useRef, useCallback } from "react";
import { cn } from "../cn";
import type { Placement } from "../types";

interface ModalProps extends React.DialogHTMLAttributes<HTMLDialogElement> {
  children: React.ReactNode;
  closeOnBackdrop?: boolean;
  placement?: Placement;
  boxClassName?: string;
}

export const Modal = forwardRef<HTMLDialogElement, ModalProps>(
  ({ children, className, closeOnBackdrop = true, placement, boxClassName, ...props }, ref) => {
    return (
      <dialog
        ref={ref}
        className={cn("modal", placement && `modal-${placement}`, className)}
        {...props}
      >
        <div className={cn("modal-box", boxClassName)}>{children}</div>
        {closeOnBackdrop && (
          <form method="dialog" className="modal-backdrop">
            <button>esc</button>
          </form>
        )}
      </dialog>
    );
  }
);
Modal.displayName = "Modal";

export function ModalAction({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("modal-action", className)}>
      <form method="dialog">{children}</form>
    </div>
  );
}

export function useModal() {
  const ref = useRef<HTMLDialogElement>(null);
  const open = useCallback(() => {
    ref.current?.showModal();
    setTimeout(() => {
      const input = ref.current?.querySelector<HTMLElement>("input, [autofocus]");
      input?.focus();
    }, 0);
  }, []);
  const close = useCallback(() => ref.current?.close(), []);
  return { ref, open, close };
}

export type { ModalProps };
