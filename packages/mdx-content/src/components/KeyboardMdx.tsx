import type { CSSProperties, ReactNode } from "react";

type KeyboardMdxProps = {
  show: string;
  type?: "window" | "mac";
  style?: CSSProperties;
};

const wrapperStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid hsl(var(--border, 210 20% 85%))",
  borderBottomWidth: 2,
  borderRadius: 8,
  background: "hsl(var(--muted, 210 20% 92%))",
  color: "hsl(var(--foreground, 220 30% 15%))",
  minWidth: "1.9rem",
  height: "1.7rem",
  padding: "0 0.45rem",
  fontSize: "0.8rem",
  fontWeight: 600,
  lineHeight: 1,
};

const aliases: Record<string, string> = {
  cmd: "Win",
  command: "Win",
  ctrl: "Ctrl",
  control: "Ctrl",
  alt: "Alt",
  option: "Alt",
  shift: "Shift",
  tab: "Tab",
  enter: "Enter",
  return: "Enter",
  delete: "Del",
  del: "Del",
  escape: "Esc",
  esc: "Esc",
  space: "Space",
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
};

const macSymbols: Record<string, string> = {
  cmd: "⌘",
  command: "⌘",
  ctrl: "⌃",
  control: "⌃",
  alt: "⌥",
  option: "⌥",
  shift: "⇧",
  tab: "⇥",
  enter: "⏎",
  return: "⏎",
  delete: "⌫",
  del: "⌫",
  escape: "⎋",
  esc: "⎋",
  space: "␣",
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
};


function normalize(show: string, type: "window" | "mac") {
  const token = (show || "").toLowerCase();
  const label = aliases[token] || show || "Key";

  if (type === "mac") {
    return macSymbols[token] || label;
  }
  return label;
}

export function KbdMdx({ show, type = "window", style }: KeyboardMdxProps) {
  const label = normalize(show, type);
  const isLetter = /^[a-zA-Z]$/.test(show);
  const display = isLetter ? show.toUpperCase() : label;
  return <kbd style={{ ...wrapperStyle, ...style }}>{display}</kbd>;
}
