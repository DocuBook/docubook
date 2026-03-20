"use client";

import { useMemo, useState } from "react";
import { TerminalSquareIcon, ClipboardIcon, CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const commands = {
  npm: "npx @docubook/cli@latest",
  pnpm: "pnpm dlx @docubook/cli@latest",
  yarn: "yarn dlx @docubook/cli@latest",
  bun: "bunx @docubook/cli@latest",
} as const;

const tabKeys = ["npm", "pnpm", "yarn", "bun"] as const;

export function CopyCommand() {
  const [packageManager, setPackageManager] = useState<keyof typeof commands>("npm");
  const [copied, setCopied] = useState(false);

  const command = useMemo(() => commands[packageManager], [packageManager]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 5000);
  };

  return (
    <div className="w-full max-w-[540px] mt-10 mb-12 overflow-hidden rounded-2xl border border-border/20 bg-card/40 shadow-lg backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3 bg-card/50 px-4 py-3 backdrop-blur">
        <div className="flex flex-1 items-center gap-3 min-w-0">
          <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-border/10 text-muted-foreground shadow-sm">
            <TerminalSquareIcon className="w-5 h-5" />
          </div>

          <div className="flex flex-1 min-w-0">
            <div className="flex min-w-0 flex-1 items-center gap-0 overflow-hidden py-0.5">
              {tabKeys.map((key) => {
                const active = key === packageManager;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPackageManager(key)}
                    className={cn(
                      "flex items-center justify-center whitespace-nowrap rounded-xl px-2 py-1.5 text-sm font-medium transition",
                      active
                        ? "bg-card text-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background/20"
                    )}
                  >
                    {key}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <button
          onClick={copyToClipboard}
          className="flex h-6 w-6 cursor-copy items-center justify-center rounded-sm border border-border/20 bg-border/10 text-muted-foreground shadow-sm transition hover:bg-border/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card/40"
          aria-label="Copy command"
        >
          {copied ? (
            <CheckIcon className="w-4 h-4 text-emerald-500" />
          ) : (
            <ClipboardIcon className="w-4 h-4" />
          )}
        </button>
      </div>

      <div className="border-t border-border/20 px-4 py-3">
        <div className="rounded-xl bg-card/30 px-4 py-3 font-mono text-sm text-left text-muted-foreground shadow-sm backdrop-blur">
          <pre className="whitespace-pre-wrap break-words">{command}</pre>
        </div>
      </div>
    </div>
  );
}
export default CopyCommand;
