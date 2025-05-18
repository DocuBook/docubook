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
      className="relative inline-block cursor-pointer underline decoration-dotted text-blue-500"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {text}
      {visible && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl bg-background text-foreground text-sm p-2 rounded shadow-md break-words text-center outline outline-1 outline-offset-2">
          {tip}
        </span>
      )}
    </span>
  );
};

export default Tooltip;
