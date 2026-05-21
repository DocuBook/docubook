import { CSSProperties, FC, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface AnimatedShinyTextProps {
  children: ReactNode;
  className?: string;
  shimmerWidth?: number;
}

const AnimatedShinyText: FC<AnimatedShinyTextProps> = ({
  children,
  className,
  shimmerWidth = 100,
}) => {
  return (
    <p
      style={
        {
          "--shiny-width": `${shimmerWidth}px`,
        } as CSSProperties
      }
      className={cn(
        "mx-auto max-w-md text-neutral-600/70 dark:text-neutral-400/70",

        // Shine effect
        "animate-shiny-text [background-size:var(--shiny-width)_100%] bg-clip-text [background-position:0_0] bg-no-repeat",

        // Shine gradient (aurora colors)
        "bg-gradient-to-r from-[#FF0080] via-[#0070F3] via-[#7928CA] to-[#38bdf8] dark:from-[#FF0080] dark:via-[#0070F3] dark:via-[#7928CA] dark:to-[#38bdf8]",

        className
      )}
    >
      {children}
    </p>
  );
};

export default AnimatedShinyText;
