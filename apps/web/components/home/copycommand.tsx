"use client";

import { useState } from "react";
import { TerminalSquareIcon, ClipboardIcon, CheckIcon } from "lucide-react";

export function CopyCommand() {
  const [copied, setCopied] = useState(false);
  const command = "npx @docubook/create";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 5000);
  };

  return (
    <div className="relative flex flex-row items-center justify-center sm:gap-2 gap-0.5 text-muted-foreground text-md mt-10 mb-12 font-code text-base font-medium group">
      <TerminalSquareIcon className="w-5 h-5 mr-1 mt-0.5" />
      <span className="select-all">{command}</span>
      <button
        onClick={copyToClipboard}
        className="p-1 ml-1 transition-opacity rounded-md opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-copy"
      >
        {copied ? (
          <CheckIcon className="w-4 h-4 text-green-500" />
        ) : (
          <ClipboardIcon className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
export default CopyCommand;
