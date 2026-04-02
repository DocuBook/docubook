'use client';

import React, { useId, useState, type CSSProperties, type HTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import { ChevronRight, File as FileIcon, Folder as FolderIcon, FolderOpen } from "lucide-react";

type FilesMdxProps = HTMLAttributes<HTMLDivElement> & { children?: ReactNode; style?: CSSProperties };
type FolderMdxProps = HTMLAttributes<HTMLDivElement> & { name: string; children?: ReactNode; style?: CSSProperties };
type FileMdxProps = HTMLAttributes<HTMLDivElement> & { name: string; style?: CSSProperties };

export function FilesMdx({ children, style, className, ...props }: FilesMdxProps) {
    return (
        <div
            className={className}
            {...props}
            role="tree"
            aria-label={props["aria-label"] ?? "File tree"}
            style={{
                border: "1px solid hsl(var(--border, 210 14% 94%))",
                borderRadius: 12,
                padding: "0.5rem",
                margin: "1rem 0",
                background: "hsla(var(--card, 0 0% 100%) / 0.9)",
                backdropFilter: "blur(8px)",
                boxShadow: "0 10px 20px rgba(0,0,0,0.05)",
                ...style,
            }}
        >
            {children}
        </div>
    );
}

export function FolderMdx({ name, children, style, className, ...props }: FolderMdxProps) {
    const [isOpen, setIsOpen] = useState(true);
    const [isHovered, setIsHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const hasChildren = React.Children.count(children) > 0;
    const groupId = useId();

    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
        if (!hasChildren) {
            return;
        }

        if (event.key === "ArrowRight") {
            event.preventDefault();
            setIsOpen(true);
            return;
        }

        if (event.key === "ArrowLeft") {
            event.preventDefault();
            setIsOpen(false);
            return;
        }

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setIsOpen((prev) => !prev);
        }
    };

    return (
        <div
            className={className}
            {...props}
            role="treeitem"
            aria-expanded={hasChildren ? isOpen : undefined}
            style={{ marginLeft: "0.35rem", ...style }}
        >
            <button
                type="button"
                className="flex items-center gap-2 rounded-md py-1.5 px-2 transition-colors duration-150"
                onClick={() => hasChildren && setIsOpen((prev) => !prev)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={handleKeyDown}
                aria-label={`${isOpen ? "Collapse" : "Expand"} folder ${name}`}
                aria-expanded={hasChildren ? isOpen : undefined}
                aria-controls={hasChildren ? groupId : undefined}
                style={{
                    cursor: hasChildren ? "pointer" : "default",
                    width: "100%",
                    border: "none",
                    textAlign: "left",
                    background: isHovered || isFocused ? "hsla(var(--muted, 210 20% 92%) / 0.45)" : "transparent",
                }}
            >
                {hasChildren ? (
                    <ChevronRight
                        className="h-3.5 w-3.5 transition-transform duration-200"
                        style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", color: isHovered || isFocused ? "hsl(var(--primary, 210 100% 56%))" : "var(--muted-foreground)" }}
                    />
                ) : (
                    <div className="w-3.5" />
                )}
                {isOpen ? (
                    <FolderOpen className="h-4 w-4" style={{ color: isHovered || isFocused ? "hsl(var(--primary, 210 100% 56%))" : "var(--muted-foreground)" }} />
                ) : (
                    <FolderIcon className="h-4 w-4" style={{ color: isHovered || isFocused ? "hsl(var(--primary, 210 100% 56%))" : "var(--muted-foreground)" }} />
                )}
                <span style={{ fontWeight: 600, color: isHovered || isFocused ? "hsl(var(--primary, 210 100% 56%))" : "var(--foreground)" }}>{name}</span>
            </button>
            {isOpen && hasChildren && (
                <div id={groupId} role="group" style={{ marginLeft: "1rem", borderLeft: "2px solid hsl(var(--border, 210 20% 85%))", paddingLeft: "0.6rem" }}>
                    {children}
                </div>
            )}
        </div>
    );
}

export function FileMdx({ name, style, className, ...props }: FileMdxProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const fileExtension = name.split(".").pop()?.toUpperCase();

    return (
        <div
            className={className}
            {...props}
            role="treeitem"
            tabIndex={0}
            style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.33rem 0.5rem",
                borderRadius: "0.45rem",
                userSelect: "none",
                background: isHovered || isFocused ? "hsla(var(--muted, 210 20% 92%) / 0.35)" : "transparent",
                ...style,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
        >
            <FileIcon className="h-3.5 w-3.5" style={{ color: isHovered || isFocused ? "hsl(var(--primary, 210 100% 56%))" : "var(--muted-foreground)" }} />
            <span style={{ fontFamily: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace", fontSize: "0.9rem", color: "var(--foreground)" }}>{name}</span>
            {(isHovered || isFocused) && fileExtension && (
                <span style={{ marginLeft: "auto", fontSize: "0.7rem", color: "var(--muted-foreground)" }}>{fileExtension}</span>
            )}
        </div>
    );
}

