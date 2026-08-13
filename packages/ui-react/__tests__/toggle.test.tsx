import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Toggle, ToggleGroup } from "../src/base/toggle";

describe("Toggle", () => {
  it("renders with toggle class", () => {
    render(<Toggle data-testid="toggle" />);
    expect(screen.getByTestId("toggle")).toHaveClass("toggle-primary");
  });

  it("applies color variant", () => {
    render(<Toggle data-testid="toggle" color="secondary" />);
    expect(screen.getByTestId("toggle")).toHaveClass("toggle-secondary");
  });

  it("applies size variant", () => {
    render(<Toggle data-testid="toggle" size="lg" />);
    expect(screen.getByTestId("toggle")).toHaveClass("toggle-lg");
  });

  it("renders with label", () => {
    render(<Toggle label="Enable feature" />);
    expect(screen.getByText("Enable feature")).toBeDefined();
  });

  it("renders with description", () => {
    render(<Toggle label="Feature" description="This enables the feature" />);
    expect(screen.getByText("This enables the feature")).toBeDefined();
  });

  it("calls onChange when toggled", () => {
    const onChange = vi.fn();
    render(<Toggle data-testid="toggle" onChange={onChange} />);
    fireEvent.click(screen.getByTestId("toggle"));
    expect(onChange).toHaveBeenCalled();
  });

  it("respects disabled state", () => {
    render(<Toggle data-testid="toggle" disabled />);
    expect(screen.getByTestId("toggle")).toBeDisabled();
  });

  it("applies custom className", () => {
    render(<Toggle data-testid="toggle" className="custom-toggle" />);
    expect(screen.getByTestId("toggle")).toHaveClass("custom-toggle");
  });
});

describe("ToggleGroup", () => {
  const items = [
    { value: "a", label: "Option A" },
    { value: "b", label: "Option B" },
    { value: "c", label: "Option C", disabled: true },
  ];

  it("renders all items", () => {
    render(<ToggleGroup items={items} />);
    expect(screen.getByText("Option A")).toBeDefined();
    expect(screen.getByText("Option B")).toBeDefined();
    expect(screen.getByText("Option C")).toBeDefined();
  });

  it("selects item on click", () => {
    render(<ToggleGroup items={items} />);
    const toggleA = screen.getByText("Option A").previousElementSibling as HTMLInputElement;
    fireEvent.click(toggleA);
    expect(toggleA.checked).toBe(true);
  });

  it("toggles item off on second click", () => {
    render(<ToggleGroup items={items} />);
    const toggleA = screen.getByText("Option A").previousElementSibling as HTMLInputElement;
    fireEvent.click(toggleA);
    fireEvent.click(toggleA);
    expect(toggleA.checked).toBe(false);
  });

  it("calls onChange with selected values", () => {
    const onChange = vi.fn();
    render(<ToggleGroup items={items} onChange={onChange} />);
    const toggleA = screen.getByText("Option A").previousElementSibling as HTMLInputElement;
    fireEvent.click(toggleA);
    expect(onChange).toHaveBeenCalledWith(["a"]);
  });

  it("respects disabled items", () => {
    render(<ToggleGroup items={items} />);
    const toggleC = screen.getByText("Option C").previousElementSibling as HTMLInputElement;
    expect(toggleC).toBeDisabled();
  });

  it("applies color and size to all toggles", () => {
    render(<ToggleGroup items={items} color="accent" size="sm" />);
    const toggles = document.querySelectorAll('input[type="checkbox"]');
    toggles.forEach((toggle) => {
      expect(toggle).toHaveClass("toggle-accent");
      expect(toggle).toHaveClass("toggle-sm");
    });
  });
});
