"use client"

import * as React from "react"
import { Toast } from "@base-ui/react/toast"

import { cn } from "../utils"

const toastManager = Toast.createToastManager()

type ToasterProps = React.ComponentPropsWithoutRef<typeof Toast.Provider> & {
  className?: string
  viewportClassName?: string
  toastClassName?: string
  contentClassName?: string
  titleClassName?: string
  descriptionClassName?: string
  actionClassName?: string
  closeClassName?: string
}

type ToastViewportProps = Pick<
  ToasterProps,
  | "className"
  | "viewportClassName"
  | "toastClassName"
  | "contentClassName"
  | "titleClassName"
  | "descriptionClassName"
  | "actionClassName"
  | "closeClassName"
>

function ToastViewport({
  className,
  viewportClassName,
  toastClassName,
  contentClassName,
  titleClassName,
  descriptionClassName,
  actionClassName,
  closeClassName,
}: ToastViewportProps) {
  const { toasts } = Toast.useToastManager()

  return (
    <Toast.Portal>
      <Toast.Viewport
        className={cn(
          "toaster group fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
          className,
          viewportClassName
        )}
      >
        {toasts.map((toast) => {
          const { actionProps } = toast

          return (
            <Toast.Root
              key={toast.id}
              toast={toast}
              className={cn(
                "group toast relative overflow-hidden rounded-md border border-border bg-background p-0 text-foreground shadow-lg transition-all data-[ending-style]:animate-out data-[ending-style]:fade-out-80 data-[starting-style]:animate-in data-[starting-style]:fade-in-0 data-[starting-style]:slide-in-from-top-full data-[type=error]:border-destructive data-[type=error]:text-destructive data-[swiping]:translate-x-[var(--toast-swipe-movement-x)] sm:data-[starting-style]:slide-in-from-bottom-full",
                toastClassName
              )}
            >
              <Toast.Content
                className={cn(
                  "grid gap-1 p-4 pr-8 has-[button]:grid-cols-[1fr_auto] has-[button]:items-center has-[button]:gap-x-3",
                  contentClassName
                )}
              >
                {toast.title ? (
                  <Toast.Title
                    className={cn("text-sm font-semibold", titleClassName)}
                  >
                    {toast.title}
                  </Toast.Title>
                ) : null}
                {toast.description ? (
                  <Toast.Description
                    className={cn(
                      "text-sm text-muted-foreground",
                      descriptionClassName
                    )}
                  >
                    {toast.description}
                  </Toast.Description>
                ) : null}
                {actionProps ? (
                  <Toast.Action
                    {...actionProps}
                    className={cn(
                      "row-span-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                      actionClassName,
                      actionProps.className
                    )}
                  />
                ) : null}
              </Toast.Content>
              <Toast.Close
                className={cn(
                  "absolute right-2 top-2 rounded-md p-1 text-muted-foreground opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  closeClassName
                )}
              >
                <span aria-hidden="true">&times;</span>
                <span className="sr-only">Close</span>
              </Toast.Close>
            </Toast.Root>
          )
        })}
      </Toast.Viewport>
    </Toast.Portal>
  )
}

const Toaster = ({
  className,
  viewportClassName,
  toastClassName,
  contentClassName,
  titleClassName,
  descriptionClassName,
  actionClassName,
  closeClassName,
  toastManager: manager = toastManager,
  children,
  ...props
}: ToasterProps) => {
  return (
    <Toast.Provider toastManager={manager} {...props}>
      {children}
      <ToastViewport
        className={className}
        viewportClassName={viewportClassName}
        toastClassName={toastClassName}
        contentClassName={contentClassName}
        titleClassName={titleClassName}
        descriptionClassName={descriptionClassName}
        actionClassName={actionClassName}
        closeClassName={closeClassName}
      />
    </Toast.Provider>
  )
}

export { Toaster, toastManager }
export const useToastManager = Toast.useToastManager
