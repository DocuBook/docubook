"use client";

import * as React from "react";
import { Separator as BaseSeparator } from "@base-ui/react/separator";
import { cn } from "../utils";

const Separator = React.forwardRef<
  React.ElementRef<typeof BaseSeparator>,
  React.ComponentPropsWithoutRef<typeof BaseSeparator> & { decorative?: boolean }
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <BaseSeparator
      ref={ref}
      orientation={orientation}
      aria-hidden={decorative ? true : undefined}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
);
Separator.displayName = "Separator";

export { Separator };
