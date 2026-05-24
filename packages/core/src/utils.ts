import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Node } from "unist";

export interface ElementNode extends Node {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown> & {
    className?: string[] | string;
    raw?: string;
  };
  data?: Record<string, unknown>;
  children?: Node[];
  raw?: string;
  language?: string;
  codeTitle?: string;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Parse both `dd-MM-yyyy` and ISO 8601 date strings into a Date object. */
export function parseDate(dateStr: string): Date {
  if (/^\d{4}-/.test(dateStr)) return new Date(dateStr);
  const [day, month, year] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function stringToDate(date: string | Date) {
  return date instanceof Date ? date : parseDate(date);
}

/** Format date to long format (e.g. "Thursday, April 5, 2026") */
export function formatDate(dateStrOrDate: string | Date): string {
  const date = stringToDate(dateStrOrDate);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Format date to short format (e.g. "Apr 5, 2026") */
export function formatDate2(dateStrOrDate: string | Date): string {
  const date = stringToDate(dateStrOrDate);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function toIsoDateOnly(dateStrOrDate: string | Date): string {
  const date = stringToDate(dateStrOrDate);
  return date.toISOString().slice(0, 10);
}
