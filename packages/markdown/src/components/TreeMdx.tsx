"use client";

import React, {
  useId,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { ChevronRight, File as FileIcon, Folder as FolderIcon, FolderOpen } from "lucide-react";

type TreeMdxProps = {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

interface TreeNode {
  name: string;
  children: TreeNode[];
}

/** Collect all text (and inline code) from the rendered children tree. */
function collectText(node: ReactNode, out: string[]): void {
  if (typeof node === "string" || typeof node === "number") {
    out.push(String(node));
  } else if (Array.isArray(node)) {
    node.forEach((n) => collectText(n, out));
  } else if (React.isValidElement(node)) {
    const kids = (node.props as { children?: ReactNode } | undefined)?.children;
    if (kids !== undefined && kids !== null) collectText(kids, out);
  }
}

/**
 * Parse ASCII tree lines into a node tree.
 * - first line = root (never popped)
 * - depth = count of "│" pipes before the connector (leading spaces are
 *   stripped by the markdown parser, so indentation MUST use pipes)
 * - folder: name ends with "/" (trailing slash)
 */
function parseTree(text: string): TreeNode[] {
  const root: TreeNode[] = [];
  const stack: { node: TreeNode; depth: number }[] = [];
  let first = true;
  for (const raw of text.split("\n")) {
    const line = raw.replace(/\t/g, "  ");
    if (!line.trim()) continue;
    const connectorIdx = line.search(/[├└]/);
    const prefix = connectorIdx >= 0 ? line.slice(0, connectorIdx) : "";
    const name = line.replace(/^[\s│├└─]+/, "").trim();
    if (!name) continue;
    const depth = (prefix.match(/│/g) || []).length;
    const node: TreeNode = { name: name.replace(/\/+$/, ""), children: [] };
    if (first) {
      root.push(node);
      stack.push({ node, depth });
      first = false;
      continue;
    }
    // root is never popped (stack.length > 1 guard)
    while (stack.length > 1 && stack[stack.length - 1].depth >= depth) stack.pop();
    stack[stack.length - 1].node.children.push(node);
    stack.push({ node, depth });
  }
  return root;
}

export function TreeMdx({ className, style, children }: TreeMdxProps) {
  const parts: string[] = [];
  collectText(children, parts);
  const tree = parseTree(parts.join(""));
  if (tree.length === 0) return null;

  return (
    <div
      className={className}
      role="tree"
      aria-label="Tree"
      style={{
        border: "1px solid hsl(var(--border-color, 210 20% 85%))",
        borderRadius: 12,
        padding: "0.5rem",
        margin: "1rem 0",
        background: "hsla(var(--card, 0 0% 100%) / 0.9)",
        backdropFilter: "blur(8px)",
        boxShadow: "0 10px 20px rgba(0,0,0,0.05)",
        ...style,
      }}
    >
      {tree.map((node) => (
        <TreeRow key={node.name} node={node} />
      ))}
    </div>
  );
}

function TreeRow({ node }: { node: TreeNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const hasChildren = node.children.length > 0;
  const groupId = useId();

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!hasChildren) return;
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
      role="treeitem"
      aria-expanded={hasChildren ? isOpen : undefined}
      style={{ marginLeft: "0.35rem" }}
    >
      <button
        type="button"
        className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors duration-150"
        onClick={() => hasChildren && setIsOpen((prev) => !prev)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        aria-label={`${isOpen ? "Collapse" : "Expand"} ${node.name}`}
        aria-expanded={hasChildren ? isOpen : undefined}
        aria-controls={hasChildren ? groupId : undefined}
        style={{
          cursor: hasChildren ? "pointer" : "default",
          width: "100%",
          border: "none",
          textAlign: "left",
          background:
            isHovered || isFocused ? "hsla(var(--muted, 210 20% 92%) / 0.45)" : "transparent",
        }}
      >
        {hasChildren ? (
          <ChevronRight
            className="h-3.5 w-3.5 transition-transform duration-200"
            style={{
              transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
              color:
                isHovered || isFocused
                  ? "hsl(var(--primary, 210 81% 56%))"
                  : "hsl(var(--muted-foreground, 220 15% 50%))",
            }}
          />
        ) : (
          <FileIcon
            className="h-3.5 w-3.5"
            style={{
              color:
                isHovered || isFocused
                  ? "hsl(var(--primary, 210 81% 56%))"
                  : "hsl(var(--muted-foreground, 220 15% 50%))",
            }}
          />
        )}
        {hasChildren && isOpen ? (
          <FolderOpen
            className="h-4 w-4"
            style={{
              color:
                isHovered || isFocused
                  ? "hsl(var(--primary, 210 81% 56%))"
                  : "hsl(var(--muted-foreground, 220 15% 50%))",
            }}
          />
        ) : (
          hasChildren && (
            <FolderIcon
              className="h-4 w-4"
              style={{
                color:
                  isHovered || isFocused
                    ? "hsl(var(--primary, 210 81% 56%))"
                    : "hsl(var(--muted-foreground, 220 15% 50%))",
              }}
            />
          )
        )}
        <span
          style={{
            fontWeight: 600,
            fontFamily: hasChildren
              ? "inherit"
              : "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
            fontSize: "0.9rem",
            color:
              isHovered || isFocused
                ? "hsl(var(--primary, 210 81% 56%))"
                : "hsl(var(--foreground, 220 30% 15%))",
          }}
        >
          {node.name}
        </span>
      </button>
      {hasChildren && isOpen && (
        <div
          id={groupId}
          role="group"
          style={{
            marginLeft: "1rem",
            borderLeft: "2px solid hsl(var(--border-color, 210 20% 85%))",
            paddingLeft: "0.6rem",
          }}
        >
          {node.children.map((child) => (
            <TreeRow key={child.name} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}
