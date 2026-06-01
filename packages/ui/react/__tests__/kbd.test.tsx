import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Command,
  Option,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowBigUp,
  CircleArrowOutUpLeft,
  Space,
  Delete,
  ArrowRightToLine,
} from "lucide-react";
import { FnKey } from "../src/base/kbd";

const lucideIcons = {
  Command,
  Option,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowBigUp,
  CircleArrowOutUpLeft,
  Space,
  Delete,
  ArrowRightToLine,
};

describe("FnKey — default (no icons configured)", () => {
  it("renders HTML entities with empty configure()", () => {
    FnKey.configure({});
    render(
      <>
        <FnKey.Cmd />
        <FnKey.Option />
        <FnKey.Ctrl />
        <FnKey.Shift />
        <FnKey.Esc />
        <FnKey.Space />
        <FnKey.Delete />
        <FnKey.Tab />
        <FnKey.Up />
        <FnKey.Down />
        <FnKey.Left />
        <FnKey.Right />
      </>
    );
    expect(screen.getByText("⌘")).toBeTruthy();
    expect(screen.getByText("⌥")).toBeTruthy();
    expect(screen.getByText("⌃")).toBeTruthy();
    expect(screen.getByText("⇧")).toBeTruthy();
    expect(screen.getByText("⎋")).toBeTruthy();
    expect(screen.getByText("␣")).toBeTruthy();
    expect(screen.getByText("⌫")).toBeTruthy();
    expect(screen.getByText("⇥")).toBeTruthy();
    expect(screen.getByText("↑")).toBeTruthy();
    expect(screen.getByText("↓")).toBeTruthy();
    expect(screen.getByText("←")).toBeTruthy();
    expect(screen.getByText("→")).toBeTruthy();
  });
});

describe("FnKey — with lucide icons configured", () => {
  it("renders SVG icons after configure()", () => {
    FnKey.configure(lucideIcons);
    const { container } = render(
      <>
        <FnKey.Cmd />
        <FnKey.Option />
        <FnKey.Ctrl />
        <FnKey.Shift />
        <FnKey.Esc />
        <FnKey.Space />
        <FnKey.Delete />
        <FnKey.Tab />
        <FnKey.Up />
        <FnKey.Down />
        <FnKey.Left />
        <FnKey.Right />
      </>
    );
    // Lucide icons render as SVG elements
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBe(12);
    FnKey.configure({});
  });

  it("falls back to HTML entity for unconfigured keys", () => {
    FnKey.configure({ Command: lucideIcons.Command });
    const { container } = render(
      <>
        <FnKey.Cmd />
        <FnKey.Option />
      </>
    );
    // Command uses lucide icon (SVG), Option falls back to HTML entity
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBe(1);
    expect(screen.getByText("⌥")).toBeTruthy();
    FnKey.configure({});
  });
});
