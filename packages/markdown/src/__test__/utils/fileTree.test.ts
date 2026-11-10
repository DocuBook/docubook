import { describe, expect, it } from "vitest";
import { parseFileTree, type FileTreeNode } from "../../utils/fileTree";

/** Compact outline: folders end in "/", notes follow "#", children are indented two spaces. */
function outline(nodes: FileTreeNode[], depth = 0): string[] {
  return nodes.flatMap((node) => [
    `${"  ".repeat(depth)}${node.name}${node.isFolder ? "/" : ""}${node.comment ? ` # ${node.comment}` : ""}`,
    ...outline(node.children, depth + 1),
  ]);
}

describe("parseFileTree: indentation contract", () => {
  it("nests entries by indentation alone", () => {
    const text = [
      "my-app/",
      "  src/",
      "    App.tsx",
      "    components/",
      "      Button.tsx",
      "  package.json",
    ].join("\n");
    expect(outline(parseFileTree(text))).toEqual([
      "my-app/",
      "  src/",
      "    App.tsx",
      "    components/",
      "      Button.tsx",
      "  package.json",
    ]);
  });

  it("reads four-space and tab indentation the same as two spaces", () => {
    const expected = ["docs/", "  guide/", "    intro.mdx", "  index.mdx"];
    expect(outline(parseFileTree("docs/\n    guide/\n        intro.mdx\n    index.mdx"))).toEqual(
      expected
    );
    expect(outline(parseFileTree("docs/\n\tguide/\n\t\tintro.mdx\n\tindex.mdx"))).toEqual(expected);
  });

  it("accepts uneven widths as long as children sit deeper than their parent", () => {
    const text = ["root/", "   a/", "      a1.ts", "   b/", " c.ts"].join("\n");
    // "c.ts" is shallower than "a/" and "b/" but deeper than "root/", so it is their sibling.
    expect(outline(parseFileTree(text))).toEqual(["root/", "  a/", "    a1.ts", "  b/", "  c.ts"]);
  });

  it("dedents back to a middle level", () => {
    const text = ["a/", "  b/", "    c/", "      d.ts", "    e.ts", "  f.ts"].join("\n");
    expect(outline(parseFileTree(text))).toEqual([
      "a/",
      "  b/",
      "    c/",
      "      d.ts",
      "    e.ts",
      "  f.ts",
    ]);
  });

  it("keeps names that start with + or - and names with spaces", () => {
    const text = ["routes/", "  +page.svelte", "  -private.ts", "  My Notes.md"].join("\n");
    expect(outline(parseFileTree(text))).toEqual([
      "routes/",
      "  +page.svelte",
      "  -private.ts",
      "  My Notes.md",
    ]);
  });
});

describe("parseFileTree: connectors kept for the legacy directive", () => {
  it("reads `tree` command output with four-space indents and skips its summary line", () => {
    const text = [
      "my-app",
      "├── package.json",
      "├── src",
      "│   ├── routes",
      "│   │   ├── +page.svelte",
      "│   │   └── +layout.svelte",
      "│   └── app.css",
      "└── README.md",
      "",
      "3 directories, 5 files",
    ].join("\n");
    expect(outline(parseFileTree(text))).toEqual([
      "my-app/",
      "  package.json",
      "  src/",
      "    routes/",
      "      +page.svelte",
      "      +layout.svelte",
      "    app.css",
      "  README.md",
    ]);
  });

  it("reads `tree --charset ascii` output", () => {
    const text = [".", "|-- src", "|   |-- index.ts", "|   `-- -cli.ts", "`-- package.json"].join(
      "\n"
    );
    expect(outline(parseFileTree(text))).toEqual([
      "./",
      "  src/",
      "    index.ts",
      "    -cli.ts",
      "  package.json",
    ]);
  });

  it("reads the legacy directive form where pipes carry the depth", () => {
    const text = [
      "src/",
      "├─ App.tsx",
      "└─ components/",
      "│  ├─ Button.tsx",
      "│  └─ Card.tsx",
    ].join("\n");
    expect(outline(parseFileTree(text))).toEqual([
      "src/",
      "  App.tsx",
      "  components/",
      "    Button.tsx",
      "    Card.tsx",
    ]);
  });

  it("reads plain indentation and keeps an empty folder marked by its trailing slash", () => {
    const text = ["docs/", "  index.mdx", "  guide/", "    intro.mdx", "  drafts/"].join("\n");
    expect(outline(parseFileTree(text))).toEqual([
      "docs/",
      "  index.mdx",
      "  guide/",
      "    intro.mdx",
      "  drafts/",
    ]);
  });

  it("splits trailing # and // notes from the name", () => {
    const text = ["src/", "├── main.ts   # entry point", "└── util.ts // helpers"].join("\n");
    expect(outline(parseFileTree(text))).toEqual([
      "src/",
      "  main.ts # entry point",
      "  util.ts # helpers",
    ]);
  });

  it("keeps several top-level entries as siblings and accepts CRLF line endings", () => {
    const text = "package.json\r\nsrc/\r\n└── index.ts\r\nREADME.md";
    expect(outline(parseFileTree(text))).toEqual([
      "package.json",
      "src/",
      "  index.ts",
      "README.md",
    ]);
  });

  it("returns nothing for blank input", () => {
    expect(parseFileTree("\n  \n")).toEqual([]);
  });
});
