"use client";

import { useEffect, useId, useRef, useState } from "react";

type CopyButtonProps = {
    content: string;
};

export function CopyButton({ content }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const statusId = useId();

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    async function onCopy() {
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => setCopied(false), 1600);
        } catch {
            setCopied(false);
        }
    }

    return (
        <button
            type="button"
            onClick={onCopy}
            aria-label={copied ? "Copied" : "Copy code"}
            aria-describedby={statusId}
            style={{
                position: "relative",
                border: "1px solid hsl(var(--border, 210 14% 94%))",
                borderRadius: 8,
                background: "hsl(var(--card, 0 0% 100%))",
                color: "hsl(var(--foreground, 222 12% 12%))",
                fontSize: "0.78rem",
                padding: "0.35rem 0.55rem",
                cursor: "copy",
            }}
        >
            {copied ? "Copied" : "Copy"}
            <span id={statusId} aria-live="polite" style={{ position: "absolute", left: -9999, top: "auto" }}>
                {copied ? "Code copied to clipboard" : "Ready to copy code"}
            </span>
        </button>
    );
}
