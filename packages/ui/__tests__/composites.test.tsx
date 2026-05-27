import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Modal, ModalAction } from "../src/modal";
import { Collapse, Accordion } from "../src/collapse";
import { Drawer } from "../src/drawer";

describe("Modal", () => {
  it("renders dialog with modal class", () => {
    render(<Modal data-testid="modal">content</Modal>);
    expect(screen.getByTestId("modal")).toHaveClass("modal");
  });

  it("applies placement class", () => {
    render(
      <Modal data-testid="modal" placement="bottom">
        content
      </Modal>
    );
    expect(screen.getByTestId("modal").className).toContain("modal-bottom");
  });

  it("renders backdrop when closeOnBackdrop is true", () => {
    const { container } = render(<Modal>content</Modal>);
    expect(container.querySelector(".modal-backdrop")).not.toBeNull();
  });

  it("hides backdrop when closeOnBackdrop is false", () => {
    const { container } = render(<Modal closeOnBackdrop={false}>content</Modal>);
    expect(container.querySelector(".modal-backdrop")).toBeNull();
  });
});

describe("ModalAction", () => {
  it("renders children in modal-action", () => {
    render(
      <ModalAction>
        <button>Close</button>
      </ModalAction>
    );
    expect(screen.getByText("Close").closest(".modal-action")).not.toBeNull();
  });
});

describe("Collapse", () => {
  it("renders closed by default", () => {
    const { container } = render(<Collapse title="Title">Content</Collapse>);
    expect(container.querySelector(".collapse-close")).not.toBeNull();
  });

  it("renders open when defaultOpen", () => {
    const { container } = render(
      <Collapse title="Title" defaultOpen>
        Content
      </Collapse>
    );
    expect(container.querySelector(".collapse-open")).not.toBeNull();
  });

  it("calls onOpenChange when toggled", () => {
    const onChange = vi.fn();
    render(
      <Collapse title="Title" onOpenChange={onChange}>
        Content
      </Collapse>
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("does not toggle when disabled", () => {
    const onChange = vi.fn();
    render(
      <Collapse title="Title" onOpenChange={onChange} disabled>
        Content
      </Collapse>
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("Accordion", () => {
  const items = [
    { id: "1", title: "Item 1", content: "Content 1" },
    { id: "2", title: "Item 2", content: "Content 2" },
  ];

  it("renders all items", () => {
    render(<Accordion items={items} />);
    expect(screen.getByText("Item 1")).toBeDefined();
    expect(screen.getByText("Item 2")).toBeDefined();
  });

  it("opens defaultOpen item", () => {
    const { container } = render(<Accordion items={items} defaultOpen="1" />);
    const collapses = container.querySelectorAll(".collapse");
    expect(collapses[0].className).toContain("collapse-open");
    expect(collapses[1].className).toContain("collapse-close");
  });
});

describe("Drawer", () => {
  it("renders with drawer class", () => {
    const { container } = render(<Drawer id="test">content</Drawer>);
    expect(container.querySelector(".drawer")).not.toBeNull();
  });

  it("applies drawer-end for right side", () => {
    const { container } = render(
      <Drawer id="test" side="right">
        content
      </Drawer>
    );
    expect(container.querySelector(".drawer-end")).not.toBeNull();
  });
});
