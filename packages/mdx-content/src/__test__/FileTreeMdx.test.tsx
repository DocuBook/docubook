import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { FilesMdx, FolderMdx, FileMdx } from "../components/FileTreeMdx";

describe("FileTreeMdx", () => {
  it("renders full tree structure", () => {
    const { container } = render(
      <FilesMdx>
        <FolderMdx name="src">
          <FileMdx name="App.tsx" />
          <FileMdx name="index.tsx" />
          <FolderMdx name="components">
            <FileMdx name="Button.tsx" />
          </FolderMdx>
        </FolderMdx>
      </FilesMdx>
    );
    expect(container.querySelector("[role='tree']")).not.toBeNull();
    expect(container.textContent).toContain("src");
    expect(container.textContent).toContain("App.tsx");
    expect(container.textContent).toContain("components");
  });

  it("FilesMdx accepts className and style", () => {
    const { container } = render(
      <FilesMdx className="custom" style={{ margin: 0 }}>
        <FileMdx name="test.ts" />
      </FilesMdx>
    );
    expect(container.querySelector("[role='tree']")?.className).toContain("custom");
  });

  it("FolderMdx renders without children (empty folder)", () => {
    const { container } = render(
      <FilesMdx>
        <FolderMdx name="empty" />
      </FilesMdx>
    );
    expect(container.textContent).toContain("empty");
  });

  it("FileMdx renders standalone", () => {
    const { container } = render(<FileMdx name="readme.md" />);
    expect(container.textContent).toContain("readme.md");
  });
});
