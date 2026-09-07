import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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
  it("renders a focusable button with menuitem role", () => {
    render(
      <Dropdown trigger={<button>Open</button>}>
        <DropdownItem>Item</DropdownItem>
      </Dropdown>
    );
    const item = screen.getByRole("menuitem");
    expect(item).toHaveTextContent("Item");
    expect(item.tagName).toBe("BUTTON");
  });

  it("activates onSelect on click and is keyboard-focusable", () => {
    const onSelect = vi.fn();
    render(
      <Dropdown trigger={<button>Open</button>}>
        <DropdownItem onSelect={onSelect}>Item</DropdownItem>
      </Dropdown>
    );
    const item = screen.getByRole("menuitem");
    // Native <button> handles Enter/Space activation; jsdom only simulates click.
    fireEvent.click(item);
    expect(onSelect).toHaveBeenCalledTimes(1);
    // Focusable via Tab (proves keyboard reachability — the actual #6 fix).
    item.focus();
    expect(document.activeElement).toBe(item);
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
  it("renders menuitem directly on the anchor", () => {
    render(
      <Dropdown trigger={<button>Open</button>}>
        <DropdownLink href="/page">Link</DropdownLink>
      </Dropdown>
    );
    const link = screen.getByRole("menuitem");
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/page");
  });
});
