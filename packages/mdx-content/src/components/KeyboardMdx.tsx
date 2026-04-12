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
  cmd: "Cmd",
  ctrl: "Ctrl",
  shift: "Shift",
  alt: "Alt",
  option: "Option",
  enter: "Enter",
  esc: "Esc",
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
};


function normalize(show: string) {
  const token = (show || "").toLowerCase();
  return aliases[token] || show || "Key";
}

export function KbdMdx({ show, type = "window", style }: KeyboardMdxProps) {
  const label = normalize(show);
  const prefix = type === "mac" && label === "Ctrl" ? "Cmd" : label;
  return <kbd style={{ ...wrapperStyle, ...style }}>{prefix}</kbd>;
}
