import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeControllerToggle } from "../src/base/theme-controller";

describe("ThemeControllerToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("renders toggle input", () => {
    render(<ThemeControllerToggle />);
    expect(document.querySelector(".toggle.theme-controller")).not.toBeNull();
  });

  it("renders with label", () => {
    render(<ThemeControllerToggle label="Dark mode" />);
    expect(screen.getByText("Dark mode")).toBeDefined();
  });

  it("calls onThemeChange when toggled", () => {
    const onThemeChange = vi.fn();
    render(<ThemeControllerToggle onThemeChange={onThemeChange} />);
    const toggle = document.querySelector('input[type="checkbox"]') as HTMLInputElement;
    fireEvent.click(toggle);
    expect(onThemeChange).toHaveBeenCalledWith("dark");
  });

  it("renders children render prop", () => {
    render(
      <ThemeControllerToggle>
        {({ isDark }) => <span data-testid="state">{isDark ? "Dark" : "Light"}</span>}
      </ThemeControllerToggle>
    );
    expect(screen.getByTestId("state")).toHaveTextContent("Light");
  });
});
