import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Parse both `dd-MM-yyyy` and ISO 8601 date strings into a Date object. */
function parseDate(dateStr: string): Date {
  // ISO 8601: starts with 4-digit year (e.g. "2026-04-05" or "2026-04-05T00:00:00.000Z")  
  if (/^\d{4}-/.test(dateStr)) return new Date(dateStr);
  // Legacy dd-MM-yyyy (e.g. "05-04-2026")
  const [day, month, year] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// "Thursday, April 5, 2026"
export function formatDate(dateStrOrDate: string | Date): string {
  const date = dateStrOrDate instanceof Date ? dateStrOrDate : parseDate(dateStrOrDate);

  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  return date.toLocaleDateString("en-US", options);
}

// "Apr 5, 2026"
export function formatDate2(dateStrOrDate: string | Date): string {
  const date = dateStrOrDate instanceof Date ? dateStrOrDate : parseDate(dateStrOrDate);

  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  return date.toLocaleDateString("en-US", options);
}

export function stringToDate(date: string | Date) {
  return date instanceof Date ? date : parseDate(date);
}

export function toIsoDateOnly(dateStrOrDate: string | Date): string {
  const date = stringToDate(dateStrOrDate)
  return date.toISOString().slice(0, 10)
}
