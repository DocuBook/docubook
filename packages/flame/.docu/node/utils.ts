export { cn, parseDate, formatDate, formatDate2 } from "@docubook/core";

export function isExternalUrl(url: string): boolean {
  return /^(https?:\/\/|\/\/)/.test(url);
}

export function getPath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch (err) {
    console.error("Failed to parse URL", url, err);
    return url;
  }
}

/** Get git last modified date for a file */
export async function getGitLastModified(filePath: string): Promise<string | null> {
  try {
    const cleanPath = filePath.replace(/^\//, "");
    if (
      !cleanPath ||
      !/^[a-zA-Z0-9\-_/.\s]+$/.test(cleanPath) ||
      /(^|\/)\.\.($|\/)/.test(cleanPath)
    )
      return null;
    const proc = Bun.spawn(["git", "log", "-1", "--format=%cI", "--", cleanPath], {
      stderr: "ignore",
    });
    const text = await new Response(proc.stdout).text();
    const date = text.trim();
    return date || null;
  } catch (err) {
    console.error("Failed to get git last modified for", filePath, err);
    return null;
  }
}

/** Batch git last modified dates for multiple files in a single spawn */
export async function getGitLastModifiedBatch(filePaths: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (filePaths.length === 0) return result;

  try {
    const proc = Bun.spawn(
      ["git", "log", "--format=%cI", "--name-only", "--diff-filter=ACMR", ...filePaths],
      { stderr: "ignore" }
    );
    const text = await new Response(proc.stdout).text();
    let currentDate = "";

    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
        currentDate = trimmed;
      } else if (currentDate && !result.has(trimmed)) {
        result.set(trimmed, currentDate);
      }
    }
  } catch (err) {
    console.error("Failed to get git last modified batch for", filePaths, err);
  }

  return result;
}

const MIME_TYPES: Record<string, string> = {
  html: "text/html",
  css: "text/css",
  js: "application/javascript",
  json: "application/json",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  svg: "image/svg+xml",
  ico: "image/x-icon",
  woff: "font/woff",
  woff2: "font/woff2",
};

export function getContentType(pathname: string): string {
  const ext = pathname.split(".").pop()?.toLowerCase();
  return MIME_TYPES[ext || ""] || "application/octet-stream";
}
