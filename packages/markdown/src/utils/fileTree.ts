/**
 * Parser for file trees, shared by the ```filetree fence and the legacy `::::tree` directive.
 *
 * The fence contract is indentation only: one entry per line, children indented further than their
 * parent, any width. Nesting comes from the column where each name starts, so `src/` then `  App.tsx`
 * nests the same way with two spaces or four.
 *
 * Box-drawing connectors (`├─`, `└─`, `│`, and the ASCII `|--`) are still accepted, because the legacy
 * directive depends on them: the markdown parser strips its leading spaces, so its `│` pipes carry the
 * depth. They are kept as characters and therefore still move the name to the right column. Pasted
 * `tree` output reads correctly for the same reason, although the fence does not document it.
 */

export interface FileTreeNode {
  /** Display name without the trailing `/` of a folder. */
  name: string;
  /** Trailing note written after the name: `App.tsx  # entry point` or `// entry point`. */
  comment?: string;
  /** Folder when the name ended in `/` or the entry has children. */
  isFolder: boolean;
  children: FileTreeNode[];
}

/**
 * Guide pipes and indentation, then one connector: `├── `, `└─ `, or the ASCII `|-- `, `` `-- ``, `+-- `, `\-- `.
 * The connector is required here, so a name that starts with `+` or `-` (`+page.svelte`) is never eaten.
 */
const CONNECTOR = /^(?:[ \u00a0]|│|┃|\|)*?[├└┣┗|`+\\][─━-]+ ?/;
/** Lines without a connector: a root, or plain indentation (with or without guide pipes). */
const INDENT = /^(?:[ \u00a0]|│|┃|\|)*/;
/** A note after the name, separated by whitespace: `name  # note`, `name // note`. */
const COMMENT = /\s+(?:#|\/\/)\s?(.*)$/;
/** The summary line `tree` prints last: "3 directories, 5 files". */
const SUMMARY = /^\d+\s+director(?:y|ies)(?:,\s*\d+\s+files?)?$/;

export function parseFileTree(text: string): FileTreeNode[] {
  const roots: FileTreeNode[] = [];
  // Open ancestors with the column their name starts at; a deeper column means a child.
  const stack: { node: FileTreeNode; column: number }[] = [];

  for (const raw of text.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.replace(/\t/g, "    ").replace(/\s+$/, "");
    if (!line.trim()) continue;

    const lead = line.match(CONNECTOR)?.[0] ?? line.match(INDENT)?.[0] ?? "";
    let entry = line.slice(lead.length);
    // A lone connector line ("│") is a spacer between groups, not an entry.
    if (!entry) continue;
    if (SUMMARY.test(entry.trim())) continue;

    let comment: string | undefined;
    const commentMatch = entry.match(COMMENT);
    if (commentMatch && commentMatch.index !== undefined && commentMatch.index > 0) {
      comment = commentMatch[1].trim() || undefined;
      entry = entry.slice(0, commentMatch.index);
    }

    const name = entry.trim();
    if (!name) continue;
    const isFolder = /\/+$/.test(name) && name !== "/";
    const node: FileTreeNode = {
      name: isFolder ? name.replace(/\/+$/, "") : name,
      isFolder,
      children: [],
      ...(comment ? { comment } : {}),
    };
    const column = lead.length;

    while (stack.length > 0 && stack[stack.length - 1].column >= column) stack.pop();
    const parent = stack[stack.length - 1]?.node;
    if (parent) {
      parent.children.push(node);
      parent.isFolder = true;
    } else {
      roots.push(node);
    }
    stack.push({ node, column });
  }

  return roots;
}
