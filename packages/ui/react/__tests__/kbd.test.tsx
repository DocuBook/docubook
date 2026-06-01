import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FnKey } from "../src/base/kbd";
import type { FnKeyIcons } from "../src/base/kbd";

const mockIcons: FnKeyIcons = {
  Command: () => <svg data-testid="icon-Command" />,
  Option: () => <svg data-testid="icon-Option" />,
  ChevronUp: () => <svg data-testid="icon-ChevronUp" />,
  ArrowBigUp: () => <svg data-testid="icon-ArrowBigUp" />,
  CircleArrowOutUpLeft: () => <svg data-testid="icon-CircleArrowOutUpLeft" />,
  Space: () => <svg data-testid="icon-Space" />,
  Delete: () => <svg data-testid="icon-Delete" />,
  ArrowRightToLine: () => <svg data-testid="icon-ArrowRightToLine" />,
  MoveUp: () => <svg data-testid="icon-MoveUp" />,
  MoveDown: () => <svg data-testid="icon-MoveDown" />,
  MoveLeft: () => <svg data-testid="icon-MoveLeft" />,
  MoveRight: () => <svg data-testid="icon-MoveRight" />,
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

describe("FnKey — with icons configured", () => {
  it("renders icons after configure()", () => {
    FnKey.configure(mockIcons);
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
    expect(screen.getByTestId("icon-Command")).toBeTruthy();
    expect(screen.getByTestId("icon-Option")).toBeTruthy();
    expect(screen.getByTestId("icon-ChevronUp")).toBeTruthy();
    expect(screen.getByTestId("icon-ArrowBigUp")).toBeTruthy();
    expect(screen.getByTestId("icon-CircleArrowOutUpLeft")).toBeTruthy();
    expect(screen.getByTestId("icon-Space")).toBeTruthy();
    expect(screen.getByTestId("icon-Delete")).toBeTruthy();
    expect(screen.getByTestId("icon-ArrowRightToLine")).toBeTruthy();
    expect(screen.getByTestId("icon-MoveUp")).toBeTruthy();
    expect(screen.getByTestId("icon-MoveDown")).toBeTruthy();
    expect(screen.getByTestId("icon-MoveLeft")).toBeTruthy();
    expect(screen.getByTestId("icon-MoveRight")).toBeTruthy();
    FnKey.configure({});
  });

  it("falls back to HTML entity for unconfigured keys", () => {
    FnKey.configure({ Command: mockIcons.Command });
    render(
      <>
        <FnKey.Cmd />
        <FnKey.Option />
      </>
    );
    expect(screen.getByTestId("icon-Command")).toBeTruthy();
    expect(screen.getByText("⌥")).toBeTruthy();
    FnKey.configure({});
  });
});
