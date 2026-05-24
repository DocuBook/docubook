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
    const proc = Bun.spawn(["git", "log", "-1", "--format=%cI", "--", cleanPath]);
    const text = await new Response(proc.stdout).text();
    const date = text.trim();
    return date || null;
  } catch {
    return null;
  }
}
