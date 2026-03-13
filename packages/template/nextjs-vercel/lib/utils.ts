import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Thursday, May 23, 2024
export function formatDate(dateStr: string): string {
  const [day, month, year] = dateStr.split("-").map(Number)
  const date = new Date(year, month - 1, day)

  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }

  return date.toLocaleDateString("en-US", options)
}

//  May 23, 2024
export function formatDate2(dateStr: string): string {
  const [day, month, year] = dateStr.split("-").map(Number)
  const date = new Date(year, month - 1, day)

  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  }
  return date.toLocaleDateString("en-US", options)
}

export function stringToDate(date: string) {
  const [day, month, year] = date.split("-").map(Number)
  return new Date(year, month - 1, day)
}
