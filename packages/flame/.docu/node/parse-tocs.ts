import type { TocItem } from "./types";

export function safeParseTocs(raw: string | undefined): TocItem[] {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
