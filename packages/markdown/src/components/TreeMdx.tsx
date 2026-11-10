"use client";

import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  ChevronRight,
  File as FileIcon,
  FileCode,
  FileCog,
  FileImage,
  FileJson,
  FileLock,
  FileText,
  Folder as FolderIcon,
  FolderOpen,
  type LucideIcon,
} from "lucide-react";
import { parseFileTree, type FileTreeNode } from "../utils/fileTree";

type TreeMdxProps = {
  /** ASCII tree from a ```filetree fence. */
  content?: string;
  /** Accessible label of the tree, from the fence's `title="…"` or `filetree:title`. Not shown. */
  title?: string;
  className?: string;
  style?: CSSProperties;
  /** Legacy `::::tree` directive body; its text is parsed the same way as `content`. */
  children?: ReactNode;
};

/** Collect all text (and inline code) from rendered children, for the legacy directive. */
function collectText(node: ReactNode, out: string[]): void {
  if (typeof node === "string" || typeof node === "number") {
    out.push(String(node));
  } else if (Array.isArray(node)) {
    node.forEach((n) => collectText(n, out));
  } else if (React.isValidElement(node)) {
    const kids = (node.props as { children?: ReactNode } | undefined)?.children;
    if (kids !== undefined && kids !== null) collectText(kids, out);
    // Paragraphs are separate blocks in the directive body: keep them on separate lines.
    if (node.type === "p") out.push("\n");
  }
}

interface VisibleItem {
  id: string;
  node: FileTreeNode;
  parentId?: string;
}

const CODE =
  /\.(?:[cm]?[jt]sx?|py|go|rs|rb|php|java|kts?|swift|c|cc|cpp|h|hpp|cs|vue|svelte|astro|sh|bash|zsh|ps1|lua|dart|scala|sql|html?|css|scss|sass|less|graphql|gql|wasm)$/i;
const DATA = /\.(?:json5?|jsonc)$/i;
const DOC = /\.(?:mdx?|markdown|txt|rst|adoc|pdf)$/i;
const IMAGE = /\.(?:png|jpe?g|gif|svg|webp|avif|ico|bmp)$/i;
const LOCK =
  /(?:^|\/)(?:pnpm-lock\.yaml|package-lock\.json|yarn\.lock|bun\.lockb?|Cargo\.lock|composer\.lock|Gemfile\.lock|poetry\.lock|.+\.lock)$/i;
const CONFIG =
  /(?:\.(?:ya?ml|toml|ini|conf|cfg|properties)$|^\.(?:env|npmrc|nvmrc|editorconfig|gitignore|gitattributes|dockerignore|prettierrc|eslintrc)|^(?:Dockerfile|Makefile|Procfile)$|\.config\.[cm]?[jt]s$)/i;

function fileIcon(name: string): LucideIcon {
  if (LOCK.test(name)) return FileLock;
  if (CONFIG.test(name)) return FileCog;
  if (DATA.test(name)) return FileJson;
  if (CODE.test(name)) return FileCode;
  if (DOC.test(name)) return FileText;
  if (IMAGE.test(name)) return FileImage;
  return FileIcon;
}

/** Ids are tree paths ("0", "0.2", "0.2.1"), so server and client render the same markup. */
function flattenVisible(
  nodes: FileTreeNode[],
  collapsed: Set<string>,
  prefix: string,
  parentId: string | undefined,
  out: VisibleItem[]
): void {
  nodes.forEach((node, index) => {
    const id = prefix ? `${prefix}.${index}` : String(index);
    out.push({ id, node, parentId });
    if (node.children.length > 0 && !collapsed.has(id)) {
      flattenVisible(node.children, collapsed, id, id, out);
    }
  });
}

export function TreeMdx({ content, title, className, style, children }: TreeMdxProps) {
  let source = content;
  if (source === undefined) {
    const parts: string[] = [];
    collectText(children, parts);
    source = parts.join("");
  }
  const roots = useMemo(() => parseFileTree(source), [source]);

  // Everything starts expanded, so the server-rendered page shows the whole tree without JavaScript.
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [activeId, setActiveId] = useState("0");
  const itemRefs = useRef(new Map<string, HTMLDivElement>());

  const visible = useMemo(() => {
    const out: VisibleItem[] = [];
    flattenVisible(roots, collapsed, "", undefined, out);
    return out;
  }, [roots, collapsed]);

  const toggle = useCallback((id: string, open?: boolean) => {
    setCollapsed((prev) => {
      const isOpen = !prev.has(id);
      if (open === isOpen) return prev;
      const next = new Set(prev);
      if (isOpen) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const focusItem = useCallback((id: string) => {
    setActiveId(id);
    itemRefs.current.get(id)?.focus();
  }, []);

  if (roots.length === 0) return null;

  const label = title || "File tree";
  // The roving tab stop must sit on a visible row; a collapsed ancestor hides the last active one.
  const tabStop = visible.some((item) => item.id === activeId) ? activeId : visible[0].id;

  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const index = visible.findIndex((item) => item.id === tabStop);
    const current = visible[index];
    if (!current) return;
    const isFolder = current.node.children.length > 0;
    const isOpen = isFolder && !collapsed.has(current.id);
    let handled = true;
    switch (event.key) {
      case "ArrowDown":
        if (visible[index + 1]) focusItem(visible[index + 1].id);
        break;
      case "ArrowUp":
        if (visible[index - 1]) focusItem(visible[index - 1].id);
        break;
      case "ArrowRight":
        if (isFolder && !isOpen) toggle(current.id, true);
        else if (isOpen) focusItem(`${current.id}.0`);
        break;
      case "ArrowLeft":
        if (isOpen) toggle(current.id, false);
        else if (current.parentId) focusItem(current.parentId);
        break;
      case "Home":
        focusItem(visible[0].id);
        break;
      case "End":
        focusItem(visible[visible.length - 1].id);
        break;
      case "Enter":
      case " ":
        if (isFolder) toggle(current.id);
        break;
      default:
        handled = false;
    }
    if (handled) event.preventDefault();
  };

  // The row is the treeitem and its group is a sibling (the WAI-ARIA navigation tree pattern), so each
  // item's accessible name is exactly its visible row; levels and positions are explicit.
  const renderNodes = (nodes: FileTreeNode[], prefix: string, level: number): ReactNode =>
    nodes.map((node, index) => {
      const id = prefix ? `${prefix}.${index}` : String(index);
      const hasChildren = node.children.length > 0;
      const isOpen = hasChildren && !collapsed.has(id);
      const Icon = node.isFolder ? (isOpen ? FolderOpen : FolderIcon) : fileIcon(node.name);
      return (
        <li key={id} role="none" className="mdx-tree-item">
          <div
            ref={(el) => {
              if (el) itemRefs.current.set(id, el);
              else itemRefs.current.delete(id);
            }}
            role="treeitem"
            aria-level={level}
            aria-setsize={nodes.length}
            aria-posinset={index + 1}
            aria-expanded={hasChildren ? isOpen : undefined}
            tabIndex={id === tabStop ? 0 : -1}
            className="mdx-tree-row"
            data-folder={node.isFolder ? "" : undefined}
            onFocus={() => setActiveId(id)}
            onClick={() => {
              focusItem(id);
              if (hasChildren) toggle(id);
            }}
          >
            {hasChildren ? (
              <ChevronRight className="mdx-tree-chevron" aria-hidden="true" />
            ) : (
              <span className="mdx-tree-chevron" aria-hidden="true" />
            )}
            <Icon className="mdx-tree-icon" aria-hidden="true" />
            <span className="mdx-tree-name">{node.name}</span>
            {node.comment ? (
              // The space is invisible between flex items but separates name and note when read aloud.
              <>
                {" "}
                <span className="mdx-tree-comment">{node.comment}</span>
              </>
            ) : null}
          </div>
          {hasChildren && isOpen ? (
            <ul role="group" className="mdx-tree-group">
              {renderNodes(node.children, id, level + 1)}
            </ul>
          ) : null}
        </li>
      );
    });

  return (
    <div className={["mdx-tree", "not-prose", className].filter(Boolean).join(" ")} style={style}>
      <ul role="tree" aria-label={label} className="mdx-tree-list" onKeyDown={onKeyDown}>
        {renderNodes(roots, "", 1)}
      </ul>
    </div>
  );
}
