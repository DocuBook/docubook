import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Input, InputGroup } from "../src/base/input";
import { Kbd } from "../src/base/kbd";

describe("Input", () => {
  it("renders with base class", () => {
    render(<Input data-testid="input" />);
    expect(screen.getByTestId("input")).toHaveClass("input");
  });

  it("applies color and size variants", () => {
    render(<Input data-testid="input" color="primary" inputSize="lg" />);
    const el = screen.getByTestId("input");
    expect(el.className).toContain("input-primary");
    expect(el.className).toContain("input-lg");
  });

  it("applies ghost variant", () => {
    render(<Input data-testid="input" ghost />);
    expect(screen.getByTestId("input").className).toContain("input-ghost");
  });

  it("merges custom className", () => {
    render(<Input data-testid="input" className="custom" />);
    expect(screen.getByTestId("input").className).toContain("custom");
  });
});

describe("InputGroup", () => {
  it("renders children inside label", () => {
    render(<InputGroup>content</InputGroup>);
    expect(screen.getByText("content").closest("label")).toHaveClass("input");
  });
});

describe("Kbd", () => {
  it("renders with base class", () => {
    render(<Kbd>K</Kbd>);
    expect(screen.getByText("K")).toHaveClass("kbd");
  });

  it("applies size variant", () => {
    render(<Kbd size="sm">K</Kbd>);
    expect(screen.getByText("K").className).toContain("kbd-sm");
  });

  it("renders without size class when not provided", () => {
    render(<Kbd>K</Kbd>);
    expect(screen.getByText("K").className).not.toContain("kbd-undefined");
  });
});
