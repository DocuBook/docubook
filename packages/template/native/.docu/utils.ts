type ClassValue = string | number | boolean | undefined | null | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === "string") {
      classes.push(input);
    } else if (Array.isArray(input)) {
      for (const item of input) {
        if (item) classes.push(String(item));
      }
    } else {
      // Ignore other types
    }
  }

  return classes.join(" ");
}

/** Check if URL is external */
export function isExternalUrl(url: string): boolean {
  return /^(https?:\/\/|\/\/)/.test(url);
}

/** Extract path from URL */
export function getPath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

/** Parse date string to Date object */
export function parseDate(dateStr: string): Date {
  // ISO 8601: starts with 4-digit year (e.g. "2026-05-03")
  if (/^\d{4}-/.test(dateStr)) return new Date(dateStr);
  // Legacy dd-MM-yyyy (e.g. "03-05-2026")
  const [day, month, year] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Format date to long format */
export function formatDate(dateStr: string | Date): string {
  const date = dateStr instanceof Date ? dateStr : parseDate(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Format date to short format (e.g. "May 3, 2026") */
export function formatDate2(dateStr: string | Date): string {
  const date = dateStr instanceof Date ? dateStr : parseDate(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}