export { cn, parseDate, formatDate, formatDate2 } from "@docubook/core";

export function isExternalUrl(url: string): boolean {
  return /^(https?:\/\/|\/\/)/.test(url);
}

export function getPath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
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
  } catch {
    return null;
  }
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
