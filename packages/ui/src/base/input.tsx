import * as React from "react"
import { Input as BaseInput } from "@base-ui/react/input"

import { cn } from "../utils"

export type InputProps = React.ComponentPropsWithoutRef<typeof BaseInput>

const Input = React.forwardRef<React.ElementRef<typeof BaseInput>, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <BaseInput
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
