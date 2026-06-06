import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Dropdown, DropdownItem, DropdownLink } from "../src/base/dropdown";

describe("Dropdown", () => {
  it("renders with trigger", () => {
    render(
      <Dropdown trigger={<button>Open</button>}>
        <DropdownItem>Item</DropdownItem>
      </Dropdown>
    );
    expect(screen.getByText("Open")).toBeDefined();
  });

  it("renders children in menu", () => {
    render(
      <Dropdown trigger={<button>Open</button>}>
        <DropdownItem>Item 1</DropdownItem>
        <DropdownItem>Item 2</DropdownItem>
      </Dropdown>
    );
    expect(screen.getByText("Item 1")).toBeDefined();
    expect(screen.getByText("Item 2")).toBeDefined();
  });

  it("applies align-end class", () => {
    const { container } = render(
      <Dropdown trigger={<button>Open</button>} align="end">
        <DropdownItem>Item</DropdownItem>
      </Dropdown>
    );
    expect(container.querySelector(".right-0")).not.toBeNull();
  });

  it("applies disabled state", () => {
    const { container } = render(
      <Dropdown trigger={<button>Open</button>} disabled>
        <DropdownItem>Item</DropdownItem>
      </Dropdown>
    );
    expect(container.querySelector("details")?.className).toContain("opacity-50");
  });
});

describe("DropdownItem", () => {
  it("renders with menuitem role", () => {
    render(
      <Dropdown trigger={<button>Open</button>}>
        <DropdownItem>Item</DropdownItem>
      </Dropdown>
    );
    expect(screen.getByRole("menuitem")).toHaveTextContent("Item");
  });

  it("applies custom className", () => {
    render(
      <Dropdown trigger={<button>Open</button>}>
        <DropdownItem className="custom-item">Item</DropdownItem>
      </Dropdown>
    );
    expect(screen.getByRole("menuitem")).toHaveClass("custom-item");
  });
});

describe("DropdownLink", () => {
  it("renders as anchor tag", () => {
    render(
      <Dropdown trigger={<button>Open</button>}>
        <DropdownLink href="/page">Link</DropdownLink>
      </Dropdown>
    );
    expect(screen.getByRole("menuitem").querySelector("a")).toHaveAttribute("href", "/page");
  });
});
