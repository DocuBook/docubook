"use client";

import * as React from "react";
import { Drawer as SheetPrimitive } from "@base-ui/react/drawer";
import { cva, type VariantProps } from "class-variance-authority";
import { PanelRightClose } from "lucide-react";

import { cn } from "../utils";

type AsChildProps = {
  asChild?: boolean;
  children?: React.ReactNode;
};

function getRenderProp(children: React.ReactNode, asChild?: boolean) {
  return asChild && React.isValidElement(children) ? children : undefined;
}

const Sheet = SheetPrimitive.Root;

const SheetTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Trigger> & AsChildProps
>(({ asChild, children, ...props }, ref) => {
  const render = getRenderProp(children, asChild);

  return (
    <SheetPrimitive.Trigger ref={ref} render={render} {...props}>
      {render ? undefined : children}
    </SheetPrimitive.Trigger>
  );
});
SheetTrigger.displayName = "SheetTrigger";

const SheetClose = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Close> & AsChildProps
>(({ asChild, children, ...props }, ref) => {
  const render = getRenderProp(children, asChild);

  return (
    <SheetPrimitive.Close ref={ref} render={render} {...props}>
      {render ? undefined : children}
    </SheetPrimitive.Close>
  );
});
SheetClose.displayName = "SheetClose";

const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Backdrop>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Backdrop>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Backdrop
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[open]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = "SheetOverlay";

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[open]:animate-in data-[closed]:animate-out data-[closed]:duration-300 data-[open]:duration-500",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[closed]:slide-out-to-top data-[open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 border-t data-[closed]:slide-out-to-bottom data-[open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[closed]:slide-out-to-left data-[open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4  border-l data-[closed]:slide-out-to-right data-[open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
);

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Popup>,
  VariantProps<typeof sheetVariants> { }

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Popup>,
  SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Viewport>
      <SheetPrimitive.Popup
        ref={ref}
        className={cn(sheetVariants({ side }), className)}
        {...props}
      >
        <SheetPrimitive.Content>
          {children}
          <SheetClose className="absolute top-7 right-4 z-50 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[popup-open]:bg-secondary">
            <PanelRightClose className="w-6 h-6 shrink-0 text-muted-foreground" />
            <span className="sr-only">Close</span>
          </SheetClose>
        </SheetPrimitive.Content>
      </SheetPrimitive.Popup>
    </SheetPrimitive.Viewport>
  </SheetPortal>
));
SheetContent.displayName = "SheetContent";

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
);
SheetHeader.displayName = "SheetHeader";

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);
SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
));
SheetTitle.displayName = "SheetTitle";

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
SheetDescription.displayName = "SheetDescription";

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
