"use client";

import { forwardRef, useRef, useCallback } from "react";
import { cn } from "../../lib/utils";

interface ModalProps extends React.DialogHTMLAttributes<HTMLDialogElement> {
  children: React.ReactNode;
  closeOnBackdrop?: boolean;
  placement?: "top" | "middle" | "bottom";
  boxClassName?: string;
}

export const Modal = forwardRef<HTMLDialogElement, ModalProps>(
  ({ children, className, closeOnBackdrop = true, placement, boxClassName, ...props }, ref) => {
    const placementClass = placement ? `modal-${placement}` : "";

    return (
      <dialog ref={ref} className={cn("modal", placementClass, className)} {...props}>
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
  const open = useCallback(() => ref.current?.showModal(), []);
  const close = useCallback(() => ref.current?.close(), []);
  return { ref, open, close };
}
