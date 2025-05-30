"use client";
import React, { useState } from "react";

interface TooltipProps {
  text: string;
  tip: string;
}

const Tooltip: React.FC<TooltipProps> = ({ text, tip }) => {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className="relative inline-flex items-center cursor-help text-primary hover:text-primary/80 transition-colors"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <span className="border-b border-dashed border-primary/60 pb-0.5">
        {text}
      </span>
      {visible && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 bg-popover text-popover-foreground text-sm p-3 rounded-md shadow-lg border border-border/50 break-words text-left z-50">
          {tip}
          <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-popover rotate-45 border-b border-r border-border/50 -z-10" />
        </span>
      )}
    </span>
  );
};

export default Tooltip;
