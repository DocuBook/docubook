import { afterEach, describe, it, expect } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { TreeMdx } from "../components/TreeMdx";

afterEach(cleanup);

const fence = [
  "my-app/",
  "  src/",
  "    App.tsx   # entry point",
  "    components/",
  "      Button.tsx",
  "  package.json",
].join("\n");

const legacy = `src/
├─ App.tsx
├─ index.tsx
└─ components/
│  ├─ Button.tsx
│  └─ Card.tsx`;

const item = (name: string) => screen.getByRole("treeitem", { name: new RegExp(`^${name}`) });

describe("TreeMdx", () => {
  it("renders a ```filetree fence with its levels and notes, labelled by the title", () => {
    render(<TreeMdx content={fence} title="Project layout" />);
    expect(screen.getByRole("tree", { name: "Project layout" })).toBeTruthy();
    // The title only names the tree; it is not drawn as a header.
    expect(screen.queryByText("Project layout")).toBeNull();
    expect(item("my-app").getAttribute("aria-level")).toBe("1");
    expect(item("components").getAttribute("aria-level")).toBe("3");
    expect(item("Button.tsx").getAttribute("aria-level")).toBe("4");
    // Each item is named by its own row and note, never by its whole subtree.
    expect(screen.getByRole("treeitem", { name: "App.tsx entry point" })).toBeTruthy();
    expect(screen.getByRole("treeitem", { name: "src" })).toBeTruthy();
    expect(item("Button.tsx").getAttribute("aria-posinset")).toBe("1");
    expect(item("package.json").getAttribute("aria-setsize")).toBe("2");
  });

  it("falls back to a generic label without a title", () => {
    render(<TreeMdx content={fence} />);
    expect(screen.getByRole("tree", { name: "File tree" })).toBeTruthy();
  });

  it("still renders the legacy ::::tree directive body", () => {
    render(<TreeMdx>{legacy}</TreeMdx>);
    expect(item("components").getAttribute("aria-expanded")).toBe("true");
    expect(item("Card.tsx").getAttribute("aria-level")).toBe("3");
    expect(item("Button.tsx").getAttribute("aria-expanded")).toBeNull();
  });

  it("collects text from nested inline elements in the legacy body", () => {
    const { container } = render(
      <TreeMdx>
        <p>
          {"build()\n├─ onLoad("}
          <code>{"{filter}"}</code>
          {")"}
        </p>
      </TreeMdx>
    );
    expect(container.textContent).toContain("onLoad({filter})");
  });

  it("starts fully expanded and toggles a folder on click", () => {
    render(<TreeMdx content={fence} />);
    const components = item("components");
    expect(screen.getByText("Button.tsx")).toBeTruthy();
    fireEvent.click(within(components).getByText("components"));
    expect(components.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText("Button.tsx")).toBeNull();
    fireEvent.click(within(components).getByText("components"));
    expect(screen.getByText("Button.tsx")).toBeTruthy();
  });

  it("moves through visible items with the tree keyboard pattern", () => {
    render(<TreeMdx content={fence} />);
    const tree = screen.getByRole("tree");
    const root = item("my-app");
    expect(root.tabIndex).toBe(0);
    root.focus();

    fireEvent.keyDown(tree, { key: "ArrowDown" });
    expect(document.activeElement).toBe(item("src"));
    fireEvent.keyDown(tree, { key: "End" });
    expect(document.activeElement).toBe(item("package.json"));
    fireEvent.keyDown(tree, { key: "ArrowUp" });
    expect(document.activeElement).toBe(item("Button.tsx"));

    // Left on a file goes to its folder; Left again collapses it; Right expands, Right again enters.
    fireEvent.keyDown(tree, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(item("components"));
    fireEvent.keyDown(tree, { key: "ArrowLeft" });
    expect(item("components").getAttribute("aria-expanded")).toBe("false");
    fireEvent.keyDown(tree, { key: "ArrowRight" });
    expect(item("components").getAttribute("aria-expanded")).toBe("true");
    fireEvent.keyDown(tree, { key: "ArrowRight" });
    expect(document.activeElement).toBe(item("Button.tsx"));

    fireEvent.keyDown(tree, { key: "Home" });
    expect(document.activeElement).toBe(root);
    // Only one item is in the tab order at a time.
    expect(screen.getAllByRole("treeitem").filter((el) => el.tabIndex === 0)).toEqual([root]);
  });

  it("leaves modified keys to the browser", () => {
    render(<TreeMdx content={fence} />);
    const tree = screen.getByRole("tree");
    act(() => item("components").focus());
    for (const modifier of [{ altKey: true }, { ctrlKey: true }, { metaKey: true }]) {
      const left = new KeyboardEvent("keydown", {
        key: "ArrowLeft",
        bubbles: true,
        cancelable: true,
        ...modifier,
      });
      tree.dispatchEvent(left);
      expect(left.defaultPrevented).toBe(false);
      expect(item("components").getAttribute("aria-expanded")).toBe("true");
    }
    fireEvent.keyDown(tree, { key: "End", ctrlKey: true });
    expect(document.activeElement).toBe(item("components"));
    // The same key without a modifier is still handled.
    fireEvent.keyDown(tree, { key: "ArrowLeft" });
    expect(item("components").getAttribute("aria-expanded")).toBe("false");
  });

  it("renders only the tree, without code block chrome", () => {
    const { container } = render(<TreeMdx content={fence} title="Project layout" />);
    expect(screen.queryAllByRole("button")).toEqual([]);
    expect(container.querySelector("pre, code")).toBeNull();
    expect(container.querySelector(".mdx-tree > [role=tree]")).toBeTruthy();
  });

  it("gives files an icon by type and folders a folder icon", () => {
    const { container } = render(<TreeMdx content={fence} />);
    const icon = (name: string) =>
      within(item(name)).getAllByText(name)[0].previousElementSibling?.getAttribute("class") ?? "";
    expect(icon("my-app")).toContain("lucide-folder-open");
    expect(icon("App.tsx")).toContain("lucide-file-code");
    expect(icon("package.json")).toContain("lucide-file-braces");
    expect(container.querySelector(".mdx-tree.not-prose")).toBeTruthy();
  });

  it("renders nothing for an empty tree", () => {
    const { container } = render(<TreeMdx content={"\n"} />);
    expect(container.firstChild).toBeNull();
  });
});
